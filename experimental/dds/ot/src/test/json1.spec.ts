/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { strict as assert } from "assert";
import {
    MockContainerRuntimeFactory,
    MockFluidDataStoreRuntime,
    MockStorage,
} from "@fluidframework/test-runtime-utils";
import { Jsonable } from "@fluidframework/datastore-definitions";
import { SharedJson1, Json1Factory } from "./json1";

// eslint-disable-next-line max-len
const createLocalOT = (id: string) => {
    const factory = SharedJson1.getFactory();
    return factory.create(new MockFluidDataStoreRuntime(), id) as SharedJson1;
}

function createConnectedOT(id: string, runtimeFactory: MockContainerRuntimeFactory) {
    // Create and connect a second SharedCell.
    const dataStoreRuntime = new MockFluidDataStoreRuntime();
    const containerRuntime = runtimeFactory.createContainerRuntime(dataStoreRuntime);
    const services = {
        deltaConnection: containerRuntime.createDeltaConnection(),
        objectStorage: new MockStorage(),
    };

    const ot = new SharedJson1(id, dataStoreRuntime, (Json1Factory as any).Attributes);
    ot.connect(services);
    return ot;
}

describe("OT", () => {
    describe("Local state", () => {
        let ot: SharedJson1;

        beforeEach(() => {
            ot = createLocalOT("OT");

            // eslint-disable-next-line no-null/no-null
            ot.replace([], null, {});
        });

        const expect = (expected: Jsonable) => {
            assert.deepEqual(ot.get(), expected);
        };

        describe("APIs", () => {
            it("Can create a OT", () => {
                assert.ok(ot, "Could not create a OT");
            });

            describe("insert()", () => {
                it("number", () => {
                    ot.insert(["x"], 1);
                    expect({ x: 1 });
                });

                it("array", () => {
                    ot.insert(["x"], []);
                    expect({ x: [] });
                });

                it("into array", () => {
                    ot.insert(["x"], []);
                    expect({ x: [] });

                    ot.insert(["x", 0], 1);
                    expect({ x: [1] });
                });
            });

            describe("remove()", () => {
                it("property from root object", () => {
                    ot.insert(["x"], 1);
                    ot.remove(["x"]);
                    expect({});
                });
            });

            describe("replace()", () => {
                it("property on root object", () => {
                    ot.insert(["x"], 1);
                    ot.replace(["x"], 1, 2);
                    expect({ x: 2 });
                });
            });

            describe("move", () => {
                it("between properties on root object", () => {
                    ot.insert(["x"], 1);
                    ot.move(["x"], ["y"]);
                    expect({ y: 1 });
                });
            });
        });
    });

    describe("Connected state", () => {
        let ot1: SharedJson1;
        let ot2: SharedJson1;
        let containerRuntimeFactory: MockContainerRuntimeFactory;

        describe("APIs", () => {
            beforeEach(() => {
                containerRuntimeFactory = new MockContainerRuntimeFactory();
                ot1 = createConnectedOT("OT1", containerRuntimeFactory);
                ot2 = createConnectedOT("OT2", containerRuntimeFactory);

                // eslint-disable-next-line no-null/no-null
                ot1.replace([], null, {});
            });

            const expect = (expected: Jsonable) => {
                containerRuntimeFactory.processAllMessages();
                assert.deepEqual(ot1.get(), expected);
                assert.deepEqual(ot2.get(), expected);
            };

            it("ensure change propagates", () => {
                ot1.insert(["x"], 1);
                expect({ x: 1 });
            });
        });
    });
});
