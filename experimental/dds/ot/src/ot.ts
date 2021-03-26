/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { bufferToString } from "@fluidframework/common-utils";
import { IFluidSerializer } from "@fluidframework/core-interfaces";

import {
    FileMode,
    ISequencedDocumentMessage,
    ITree,
    TreeEntry,
} from "@fluidframework/protocol-definitions";
import {
    IChannelAttributes,
    IFluidDataStoreRuntime,
    IChannelStorageService,
} from "@fluidframework/datastore-definitions";
import { SharedObject } from "@fluidframework/shared-object-base";
import { debug } from "./debug";
import { IOTType } from "./types";

export abstract class SharedOT<T, TOp, TInit = T> extends SharedObject {
    private readonly pendingOps: TOp[] = [];

    private root!: T;

    /**
     * Constructs a new shared OT. If the object is non-local an id and service interfaces will
     * be provided
     *
     * @param runtime - data store runtime the shared map belongs to
     * @param id - optional name of the shared map
     */
    constructor(id: string, runtime: IFluidDataStoreRuntime, attributes: IChannelAttributes) {
        super(id, runtime, attributes);
    }

    protected abstract get otType(): IOTType<T, TOp, TInit>;

    public get(): T { return this.root; }

    public apply(op: TOp) {
        this.root = this.otType.apply(this.root, op);

        // If we are not attached, don't submit the op.
        if (!this.isAttached()) {
            return;
        }

        this.pendingOps.push(op);
        this.submitLocalMessage(op);
    }

    protected snapshotCore(serializer: IFluidSerializer): ITree {
        const tree: ITree = {
            entries: [
                {
                    mode: FileMode.File,
                    path: "header",
                    type: TreeEntry.Blob,
                    value: {
                        contents: serializer.stringify(this.root, this.handle),
                        encoding: "utf-8",
                    },
                },
            ],
        };

        return tree;
    }

    protected async loadCore(storage: IChannelStorageService): Promise<void> {
        const blob = await storage.readBlob("header");
        const rawContent = bufferToString(blob, "utf8");
        this.root = this.runtime.IFluidSerializer.parse(rawContent);
    }

    protected abstract get initialValue(): TInit;

    protected initializeLocalCore() {
        this.root = this.otType.create(this.initialValue);
    }

    protected registerCore() {}

    protected onDisconnect() {
        debug(`OT ${this.id} is now disconnected`);
    }

    protected processCore(message: ISequencedDocumentMessage, local: boolean) {
        if (local) {
            this.pendingOps.shift();
        } else {
            let remoteOp = message.contents;

            for (const localPendingOp of this.pendingOps) {
                remoteOp = this.otType.transform(remoteOp, localPendingOp, "right");
            }

            this.root = this.otType.apply(this.root, remoteOp);
        }
    }

    protected applyStashedOp() {
        throw new Error("not implemented");
    }
}
