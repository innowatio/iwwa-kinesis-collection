import {MongoClient} from "mongodb";
import {promisify} from "bluebird";

var connect = function (url) {
    return promisify(MongoClient.connect, MongoClient)(url);
};

export function upsert ({url, collectionName, query, element}) {
    return connect(url)
        .then(db => {
            var collection = db.getCollection(collectionName);
            return promisify(collection.upsert, collection)(query, element);
        });
}

export function remove ({url, collectionName, query}) {
    return connect(url)
        .then(db => {
            var collection = db.getCollection(collectionName);
            return promisify(collection.remove, collection)(query);
        });
}