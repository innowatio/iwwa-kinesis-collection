import {v4} from "node-uuid";

import * as kinesis from "../services/kinesis";

function putRecord (PartitionKey, StreamName, Data) {
    return kinesis.putRecord({
        Data: JSON.stringify(Data),
        PartitionKey,
        StreamName
    });
}

export function insert (element) {
    return putRecord(this.name, this.kinesisStreamName, {
        id: v4(),
        data: {
            id: v4(),
            element
        },
        timestamp: new Date().toISOString(),
        type: `element inserted in collection ${this.name}`
    });
}

export function replace (id, element) {
    // TODO check if exists!
    delete element.id;
    delete element._id;
    return putRecord(this.name, this.kinesisStreamName, {
        id: v4(),
        data: {
            id,
            element
        },
        timestamp: new Date().toISOString(),
        type: `element replaced in collection ${this.name}`
    });
}

export function remove (id) {
    return putRecord(this.name, this.kinesisStreamName, {
        id: v4(),
        data: {
            id
        },
        timestamp: new Date().toISOString(),
        type: `element removed in collection ${this.name}`
    });
}
