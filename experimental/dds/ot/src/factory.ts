/* eslint-disable prefer-arrow/prefer-arrow-functions */
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    IChannelAttributes,
    IFluidDataStoreRuntime,
    IChannelServices,
    IChannelFactory,
} from "@fluidframework/datastore-definitions";
import { SharedOT } from "./ot";
/**
 * The factory that defines the map
 */
abstract class OTFactoryBase<T, TOp, TInit, TSharedObject extends SharedOT<T, TOp, TInit>> implements IChannelFactory {
    public abstract get type();
    public abstract get attributes();
    protected abstract get ctor(): new (
        id: string,
        runtime: IFluidDataStoreRuntime,
        attributes: IChannelAttributes
    ) => TSharedObject;

    /**
     * {@inheritDoc @fluidframework/datastore-definitions#IChannelFactory.load}
     */
    public async load(
        runtime: IFluidDataStoreRuntime,
        id: string,
        services: IChannelServices,
        attributes: IChannelAttributes,
    ): Promise<TSharedObject> {
        const ot = new this.ctor(id, runtime, attributes);
        await ot.load(services);
        return ot;
    }

    public create(document: IFluidDataStoreRuntime, id: string): TSharedObject {
        const ot = new this.ctor(id, document, this.attributes);
        ot.initializeLocal();
        return ot;
    }
}

export const OTFactory = <T, TOp, TInit, TSharedObject extends SharedOT<T, TOp, TInit>>(
    ctor: new (id: string, runtime: IFluidDataStoreRuntime, attributes: IChannelAttributes) => TSharedObject,
    type: string,
    snapshotFormatVersion: string,
    packageVersion: string,
): new () => IChannelFactory => {
    const attrs = {
        type,
        snapshotFormatVersion,
        packageVersion,
    };

    return function() {
        return Object.defineProperties(
            Object.create(OTFactoryBase.prototype), {
            ctor: { value: ctor, configurable: false, writable: false, enumerable: false },
            type: { value: attrs.type, configurable: false, writable: false },
            attributes: { value: attrs, configurable: false, writable: false },
        }) as IChannelFactory;
    } as unknown as new () => IChannelFactory;
};
