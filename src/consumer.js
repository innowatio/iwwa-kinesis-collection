import router from "kinesis-router";
import uuid from "node-uuid";
import {merge} from "ramda";

import * as dynamodb from "./common/dynamodb";

var insert = function insert (event) {
    var {element} = event.data;
    var id = uuid.v4();
    return dynamodb.putItem({
        Item: merge(element, {id}),
        TableName: this.dynamodbTableName
    });
};

var remove = function remove (event) {
    var {id} = event.data;
    return dynamodb.deleteItem({
        Key: {id},
        TableName: this.dynamodbTableName
    });
};

var replace = function replace (event) {
    var {id, element} = event.data;
    return dynamodb.putItem({
        Item: merge(element, {id}),
        TableName: this.dynamodbTableName
    });
};

export default function consumer (kinesisEvent, context) {
    return router()
        .on(`/${this.name}/insert`, insert.bind(this))
        .on(`/${this.name}/remove`, remove.bind(this))
        .on(`/${this.name}/replace`, replace.bind(this))
        .call(null, kinesisEvent, context);
}
