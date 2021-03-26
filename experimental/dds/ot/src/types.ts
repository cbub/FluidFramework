/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface IOTType<T, TOp, TInit> {
    apply(doc: T, op: TOp): T;
    transform(left: TOp, right: TOp, side: "left" | "right"): TOp;
    create(init: TInit): T;
}
