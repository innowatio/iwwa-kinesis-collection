import {MongoClient} from "mongodb";
import {memoize} from "ramda";

const connect = memoize(url => MongoClient.connect(url));

export function upsert ({url, collectionName, query, element}) {
    return connect(url)
        .then(db => db.collection(collectionName).update(
            query, element, {upsert: true}
        ));
}

export function remove ({url, collectionName, query}) {
    return connect(url)
        .then(db => db.collection(collectionName).remove(
            query
        ));
}

export function findOne ({url, collectionName, query}) {
    return connect(url)
        .then(db => db.collection(collectionName).findOne(
            query
        ));
}

export function exists ({url, collectionName, query}) {
    return connect(url)
        .then(db => db.collection(collectionName)
            .find(query).limit(1).count(true)
        )
        .then(count => count > 0);
}
