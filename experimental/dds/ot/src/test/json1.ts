/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IFluidDataStoreRuntime, Serializable } from "@fluidframework/datastore-definitions";
import { Doc, type as Json1Type, JSONOp, replaceOp, insertOp, moveOp, removeOp, Path } from "ot-json1";
import { OTFactory } from "../factory";
import { SharedOT } from "../ot";
import { pkgVersion } from "../packageVersion";
import { IOTType } from "../types";

export class SharedJson1 extends SharedOT<Doc, JSONOp> {
     public static create(runtime: IFluidDataStoreRuntime, id?: string): SharedJson1 {
		return runtime.createChannel(id, (Json1Factory as any).Type) as SharedJson1;
	}

	public static getFactory() { return new Json1Factory(); }

    protected get otType() { return Json1Type as IOTType<Doc, JSONOp, Doc>; }

    // eslint-disable-next-line no-null/no-null
    protected get initialValue(): Doc { return null; }

    public get(): Doc { return super.get(); }

    public insert(path: Path, value: Serializable) {
        this.apply(insertOp(path, value as Doc));
    }

    public move(from: Path, to: Path) {
        this.apply(moveOp(from, to));
    }

    public remove(path: Path, value?: boolean) {
        this.apply(removeOp(path, value));
    }

    public replace(path: Path, oldValue: Serializable, newValue: Serializable) {
        this.apply(replaceOp(path, oldValue as Doc, newValue as Doc));
    }
}

export const Json1Factory = OTFactory(SharedJson1, Json1Type.name, "0.1", pkgVersion);
