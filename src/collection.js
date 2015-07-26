import {Kinesis} from "aws-sdk";
import BPromise from "bluebird";
import jsonpatch from "fast-json-patch";

var kinesis = BPromise.promisifyAll(new Kinesis({apiVersion: "2013-12-02"}));
var STREAM_NAME = process.env.KINESIS_STREAM_NAME;

export default class Collection {

    constructor (name) {
        this.name = name;
    }

    processEvent ({method, params}) {
        if (method === `/${this.name}/insert`) {
            return this.insert(...params);
        }
        if (method === `/${this.name}/update`) {
            return this.update(...params);
        }
        if (method === `/${this.name}/remove`) {
            return this.remove(...params);
        }
    }

    insert (element) {
        // TODO: auth and validation
        return kinesis.putRecordAsync({
            Data: JSON.stringify({
                data: {element},
                timestamp: Date.now(),
                type: `/${this.name}/insert`
            }),
            PartitionKey: this.name,
            StreamName: STREAM_NAME
        });
    }

    remove (id) {
        // TODO: auth and validation
        return kinesis.putRecordAsync({
            Data: JSON.stringify({
                data: {id},
                timestamp: Date.now(),
                type: `/${this.name}/remove`
            }),
            PartitionKey: this.name,
            StreamName: STREAM_NAME
        });
    }

    update (id, patches) {
        // Ensure `patches` are valid JSON patches
        var error = jsonpatch.validate(patches);
        if (error) {
            throw error;
        }
        // TODO: auth and validation
        return kinesis.putRecordAsync({
            Data: JSON.stringify({
                data: {id, patches},
                timestamp: Date.now(),
                type: `/${this.name}/update`
            }),
            PartitionKey: this.name,
            StreamName: STREAM_NAME
        });
    }

}
