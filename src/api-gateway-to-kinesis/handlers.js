import {v4} from "node-uuid";

import * as kinesis from "../services/kinesis";
import log from "../services/logger";

function putRecord (PartitionKey, StreamName, Data) {
    const record = {
        Data: JSON.stringify(Data),
        PartitionKey,
        StreamName
    };
    log.info({record}, "Putting Kinesis record");
    return kinesis.putRecord(record);
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
