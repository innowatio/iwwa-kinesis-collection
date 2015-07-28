import * as kinesis from "./common/kinesis";

var insert = function insert (element) {
    // TODO: auth and validation
    return kinesis.putRecord({
        Data: JSON.stringify({
            data: {element},
            timestamp: Date.now(),
            type: `/${this.name}/insert`
        }),
        PartitionKey: this.name,
        StreamName: this.kinesisStreamName
    });
};

var remove = function remove (id, version) {
    // TODO: auth and validation
    return kinesis.putRecord({
        Data: JSON.stringify({
            data: {id, version},
            timestamp: Date.now(),
            type: `/${this.name}/remove`
        }),
        PartitionKey: this.name,
        StreamName: this.kinesisStreamName
    });
};

var replace = function replace (id, version, element) {
    // TODO: auth and validation
    return kinesis.putRecord({
        Data: JSON.stringify({
            data: {id, version, element},
            timestamp: Date.now(),
            type: `/${this.name}/replace`
        }),
        PartitionKey: this.name,
        StreamName: this.kinesisStreamName
    });
};

var processApiGatewayEvent = function processApiGatewayEvent (event) {
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

export default function producer (event, context) {
    return processApiGatewayEvent.call(this, event)
        .then(() => context.succeed())
        .catch(err => context.fail(err));
}
