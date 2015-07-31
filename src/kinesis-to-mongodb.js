import router from "kinesis-router";
import {merge} from "ramda";

import * as mongodb from "./common/mongodb";

var upsert = function (event) {
    var {element, id} = event.data;
    return mongodb.upsert({
        url: this.mongodbUrl,
        collectionName: this.mongodbCollectionName,
        query: {
            _id: id
        },
        element: merge(element, {
            _id: id
        })
    });
};

var remove = function (event) {
    var {id} = event.data;
    return mongodb.remove({
        url: this.mongodbUrl,
        collectionName: this.mongodbCollectionName,
        query: {
            _id: id
        }
    });
};

export default function kinesisToMongodb (kinesisEvent, context) {
    return router()
        .on(`element inserted in collection ${this.name}`, upsert.bind(this))
        .on(`element removed in collection ${this.name}`, remove.bind(this))
        .on(`element replaced in collection ${this.name}`, upsert.bind(this))
        .call(null, kinesisEvent, context);
}
