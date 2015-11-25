import {bind} from "bluebird";
import {v4} from "node-uuid";

import RequestError from "./request-error";
import * as mongodb from "../services/mongodb";
import * as kinesis from "../services/kinesis";
import {getLogger} from "../services/logger";

const log = getLogger();

function putRecord (PartitionKey, StreamName, Data) {
    const record = {
        Data: JSON.stringify(Data),
        PartitionKey,
        StreamName
    };
    log.info({record}, "Putting Kinesis record");
    return kinesis.putRecord(record);
}

function exists (id) {
    return mongodb.exists({
        url: this.mongodbUrl,
        collectionName: this.mongodbCollectionName,
        query: {_id: id}
    });
}

export function insert (element) {
    /*
    *   Before inserting, check that no document by the same id already exists.
    *   Else, throw a 409 error. For the sake of code simplicity, we don't
    *   throw a 5xx error (which is more correct) in the extremely unlikely case
    *   where the function `v4` generates a duplicate uuid.
    */
    const id = element.id || v4();
    return bind(this, id)
        .then(exists)
        .then(elementExists => {
            if (elementExists) {
                throw new RequestError(409, "ConflictError");
            }
        })
        .then(() => {
            delete element.id;
            return putRecord(this.name, this.kinesisStreamName, {
                id: v4(),
                data: {id, element},
                timestamp: new Date().toISOString(),
                type: `element inserted in collection ${this.name}`
            });
        })
        .thenReturn({id});
}

export function replace (id, element) {
    /*
    *   Before replacing, check that a document by the provided id actually
    *   exists. Else, throw a 404 error.
    */
    return bind(this, id)
        .then(exists)
        .then(elementExists => {
            if (!elementExists) {
                throw new RequestError(404, "NotFoundError");
            }
        })
        .then(() => {
            delete element.id;
            delete element._id;
            return putRecord(this.name, this.kinesisStreamName, {
                id: v4(),
                data: {id, element},
                timestamp: new Date().toISOString(),
                type: `element replaced in collection ${this.name}`
            });
        })
        .thenReturn(null);
}

export function remove (id) {
    /*
    *   Before removing, check that a document by the provided id actually
    *   exists. Else, throw a 404 error.
    */
    return bind(this, id)
        .then(exists)
        .then(elementExists => {
            if (!elementExists) {
                throw new RequestError(404, "NotFoundError");
            }
        })
        .then(() => {
            return putRecord(this.name, this.kinesisStreamName, {
                id: v4(),
                data: {id},
                timestamp: new Date().toISOString(),
                type: `element removed in collection ${this.name}`
            });
        })
        .thenReturn(null);
}

export function findOne (id) {
    return mongodb.findOne({
        url: this.mongodbUrl,
        collectionName: this.mongodbCollectionName,
        query: {_id: id}
    });
}
