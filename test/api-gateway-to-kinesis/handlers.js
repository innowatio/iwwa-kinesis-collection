import chai, {expect} from "chai";
import {always} from "ramda";
import sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(sinonChai);

import * as handlers from "api-gateway-to-kinesis/handlers";

describe("handlers", () => {

    const kinesis = {
        putRecord: sinon.spy()
    };
    const v4 = always("id");
    var clock;

    before(() => {
        clock = sinon.useFakeTimers();
        handlers.__Rewire__("kinesis", kinesis);
        handlers.__Rewire__("v4", v4);
    });
    after(() => {
        clock.restore();
        handlers.__ResetDependency__("kinesis");
        handlers.__ResetDependency__("v4");
    });
    beforeEach(() => {
        kinesis.putRecord.reset();
    });

    describe("insert", () => {
        it("publishes an `inserted` event to kinesis", () => {
            const instance = {
                name: "collectionName",
                kinesisStreamName: "kinesisStreamName"
            };
            const element = {};
            handlers.insert.call(instance, element);
            expect(kinesis.putRecord).to.have.been.calledWith({
                Data: JSON.stringify({
                    id: "id",
                    data: {
                        id: "id",
                        element: {}
                    },
                    timestamp: "1970-01-01T00:00:00.000Z",
                    type: "element inserted in collection collectionName"
                }),
                PartitionKey: "collectionName",
                StreamName: "kinesisStreamName"
            });
        });
    });

    describe("replace", () => {
        it("publishes a `replaced` event to kinesis", () => {
            const instance = {
                name: "collectionName",
                kinesisStreamName: "kinesisStreamName"
            };
            const id = "id";
            const element = {};
            handlers.replace.call(instance, id, element);
            expect(kinesis.putRecord).to.have.been.calledWith({
                Data: JSON.stringify({
                    id: "id",
                    data: {
                        id: "id",
                        element: {}
                    },
                    timestamp: "1970-01-01T00:00:00.000Z",
                    type: "element replaced in collection collectionName"
                }),
                PartitionKey: "collectionName",
                StreamName: "kinesisStreamName"
            });
        });
        it("strips `id` and `_id` from `element`", () => {
            const instance = {
                name: "collectionName",
                kinesisStreamName: "kinesisStreamName"
            };
            const id = "id";
            const element = {_id: "id", id: "id"};
            handlers.replace.call(instance, id, element);
            expect(kinesis.putRecord).to.have.been.calledWith({
                Data: JSON.stringify({
                    id: "id",
                    data: {
                        id: "id",
                        element: {}
                    },
                    timestamp: "1970-01-01T00:00:00.000Z",
                    type: "element replaced in collection collectionName"
                }),
                PartitionKey: "collectionName",
                StreamName: "kinesisStreamName"
            });
        });
    });

    describe("remove", () => {
        it("publishes a `removed` event to kinesis", () => {
            const instance = {
                name: "collectionName",
                kinesisStreamName: "kinesisStreamName"
            };
            const id = "id";
            handlers.remove.call(instance, id);
            expect(kinesis.putRecord).to.have.been.calledWith({
                Data: JSON.stringify({
                    id: "id",
                    data: {
                        id: "id"
                    },
                    timestamp: "1970-01-01T00:00:00.000Z",
                    type: "element removed in collection collectionName"
                }),
                PartitionKey: "collectionName",
                StreamName: "kinesisStreamName"
            });
        });
    });

});
