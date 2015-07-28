import uuid from "node-uuid";
import {merge} from "ramda";
import hashObj from "hash-obj";

import * as dynamodb from "./common/dynamodb";

var insert = function insert ({element}) {
    var id = uuid.v4();
    var version = hashObj(element);
    return dynamodb.putItem({
        Item: merge(element, {id, version}),
        TableName: this.dynamodbTableName
    });
};

var remove = function remove ({id, version}) {
    return dynamodb.deleteItem({
        Key: {
            id: {
                S: id
            }
        },
        ExpressionAttributeNames: {
            "#oldVersion": "version"
        },
        ExpressionAttributeValues: {
            ":versionToUpdate": {
                S: version
            }
        },
        ConditionExpression: "#oldVersion = :versionToUpdate",
        TableName: this.dynamodbTableName
    });
};

var replace = function replace ({id, version, element}) {
    var newVersion = hashObj(element);
    return dynamodb.putItem({
        Item: merge(element, {
            id,
            version: newVersion
        }),
        ExpressionAttributeNames: {
            "#oldVersion": "version"
        },
        ExpressionAttributeValues: {
            ":versionToUpdate": {
                S: version
            }
        },
        ConditionExpression: "#oldVersion = :versionToUpdate",
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
