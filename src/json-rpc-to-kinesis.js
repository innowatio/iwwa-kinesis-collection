import uuid from "node-uuid";

import * as kinesis from "./common/kinesis";

var insert = function (element) {
    // TODO: auth and validation
    // Generate an id for the element to create
    var id = uuid.v4();
    return kinesis.putRecord({
        Data: JSON.stringify({
            id: uuid.v4(),
            data: {element, id},
            timestamp: Date.now(),
            type: `element inserted in collection ${this.name}`
        }),
        PartitionKey: this.name,
        StreamName: this.kinesisStreamName
    });
};

var remove = function (id) {
    // TODO: auth and validation
    return kinesis.putRecord({
        Data: JSON.stringify({
            id: uuid.v4(),
            data: {id},
            timestamp: Date.now(),
            type: `element removed in collection ${this.name}`
        }),
        PartitionKey: this.name,
        StreamName: this.kinesisStreamName
    });
};

var replace = function (id, element) {
    // TODO: auth and validation
    return kinesis.putRecord({
        Data: JSON.stringify({
            id: uuid.v4(),
            data: {id, element},
            timestamp: Date.now(),
            type: `element replaced in collection ${this.name}`
        }),
        PartitionKey: this.name,
        StreamName: this.kinesisStreamName
    });
};

var processRpc = function (event) {
    var {method, params} = event;
    if (method === `/${this.name}/insert`) {
        return insert.apply(this, params);
    }
    if (method === `/${this.name}/replace`) {
        return replace.apply(this, params);
    }
    if (method === `/${this.name}/remove`) {
        return remove.apply(this, params);
    }
};

export default function jsonRpcToKinesis (event, context) {
    return processRpc.call(this, event)
        .then(() => context.succeed({
            id: event.id,
            result: null
        }))
        .catch(err => context.fail({
            id: event.id,
            error: err
        }));
}
