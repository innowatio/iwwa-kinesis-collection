import uuid from "node-uuid";
import {merge} from "ramda";

import * as dynamodb from "./common/dynamodb";

var insert = function insert ({element}) {
    var id = uuid.v4();
    return dynamodb.putItem({
        Item: merge(element, {id}),
        TableName: this.dynamodbTableName
    });
};

var remove = function remove ({id}) {
    return dynamodb.deleteItem({
        Key: {
            id: {
                S: id
            }
        },
        TableName: this.dynamodbTableName
    });
};

var replace = function replace ({id, element}) {
    return dynamodb.putItem({
        Item: merge(element, {id}),
        TableName: this.dynamodbTableName
    });
};

var processKinesisEvent = function processKinesisEvent (event) {
    // Only consider the first record
    var data = new Buffer(
        event.Records[0].kinesis.data,
        "base64"
    ).toString("ascii");
    var applicationEvent = JSON.parse(data);
    // Route based on the application event type
    if (applicationEvent.type === `/${this.name}/insert`) {
        insert.call(this, applicationEvent.data);
    }
    if (applicationEvent.type === `/${this.name}/remove`) {
        remove.call(this, applicationEvent.data);
    }
    if (applicationEvent.type === `/${this.name}/replace`) {
        replace.call(this, applicationEvent.data);
    }
};

export default function consumer (event, context) {
    return processKinesisEvent.call(this, event)
        .then(() => context.succeed())
        .catch(err => context.fail(err));
}
