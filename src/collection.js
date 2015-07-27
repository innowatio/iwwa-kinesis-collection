import {Kinesis} from "aws-sdk";
import BPromise from "bluebird";

var kinesis = BPromise.promisifyAll(new Kinesis({apiVersion: "2013-12-02"}));

export default class Collection {

    constructor (name, kinesisStreamName) {
        this.name = name;
        this.kinesisStreamName = kinesisStreamName;
    }

    processEvent ({method, params}) {
        if (method === `/${this.name}/insert`) {
            return this.insert(...params);
        }
        if (method === `/${this.name}/replace`) {
            return this.replace(...params);
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
            StreamName: this.kinesisStreamName
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
            StreamName: this.kinesisStreamName
        });
    }

    replace (id, version, element) {
        // TODO: auth and validation
        return kinesis.putRecordAsync({
            Data: JSON.stringify({
                data: {id, version, element},
                timestamp: Date.now(),
                type: `/${this.name}/replace`
            }),
            PartitionKey: this.name,
            StreamName: this.kinesisStreamName
        });
    }

}
