import router from "kinesis-router";
import {merge} from "ramda";

import * as dynamodb from "./common/dynamodb";

var put = function (event) {
    var {element, id} = event.data;
    return dynamodb.putItem({
        Item: merge(element, {id}),
        TableName: this.dynamodbTableName
    });
};

var remove = function (event) {
    var {id} = event.data;
    return dynamodb.deleteItem({
        Key: {id},
        TableName: this.dynamodbTableName
    });
};

export default function kinesisToDynamodb (kinesisEvent, context) {
    return router()
        .on(`element inserted in collection ${this.name}`, put.bind(this))
        .on(`element removed in collection ${this.name}`, remove.bind(this))
        .on(`element replaced in collection ${this.name}`, put.bind(this))
        .call(null, kinesisEvent, context);
}
