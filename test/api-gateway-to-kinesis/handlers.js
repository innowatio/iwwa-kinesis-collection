import {resolve} from "bluebird";
import chai, {expect} from "chai";
import {always} from "ramda";
import sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(sinonChai);

import * as handlers from "api-gateway-to-kinesis/handlers";
import {getErrorFromPromise} from "../test-utils";

describe("handlers", () => {

    const kinesis = {
        putRecord: sinon.spy()
    };
    const mongodb = {};
    const v4 = always("id");
    var clock;

    before(() => {
        clock = sinon.useFakeTimers();
        handlers.__Rewire__("kinesis", kinesis);
        handlers.__Rewire__("mongodb", mongodb);
        handlers.__Rewire__("v4", v4);
    });
    after(() => {
        clock.restore();
        handlers.__ResetDependency__("kinesis");
        handlers.__ResetDependency__("mongodb");
        handlers.__ResetDependency__("v4");
    });
    beforeEach(() => {
        kinesis.putRecord.reset();
        delete mongodb.exists;
        delete mongodb.findOne;
    });

    describe("insert", () => {

        it("uses the element id if provided", () => {
            mongodb.exists = always(false);
            const instance = {
                name: "collectionName",
                kinesisStreamName: "kinesisStreamName"
            };
            const element = {id: "providedId"};
            return handlers.insert.call(instance, element)
                .then(() => {
                    expect(kinesis.putRecord).to.have.been.calledWith({
                        Data: JSON.stringify({
                            id: "id",
                            data: {
                                id: "providedId",
                                element: {}
                            },
                            timestamp: "1970-01-01T00:00:00.000Z",
                            type: "element inserted in collection collectionName"
                        }),
                        PartitionKey: "collectionNameprovidedId",
                        StreamName: "kinesisStreamName"
                    });
                });
        });

        it("throws a 409 if the provided id already exists", () => {
            mongodb.exists = always(true);
            const instance = {
                name: "collectionName",
                kinesisStreamName: "kinesisStreamName"
            };
            const element = {id: "id"};
            const promise = handlers.insert.call(instance, element);
            return expect(getErrorFromPromise(promise)).to.become({
                code: 409,
                message: "ConflictError",
                details: undefined
            });
        });

        it("returns the id of the newly created element", () => {
            mongodb.exists = always(false);
            const instance = {
                name: "collectionName",
                kinesisStreamName: "kinesisStreamName"
            };
            const element = {};
            return handlers.insert.call(instance, element)
                .then(result => {
                    expect(result).to.deep.equal({id: "id"});
                });
        });

        it("publishes an `inserted` event to kinesis", () => {
            mongodb.exists = always(false);
            const instance = {
                name: "collectionName",
                kinesisStreamName: "kinesisStreamName"
            };
            const element = {};
            return handlers.insert.call(instance, element)
                .then(() => {
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
                        PartitionKey: "collectionNameid",
                        StreamName: "kinesisStreamName"
                    });
                });
        });

    });

    describe("replace", () => {

        it("throws a 404 if no element is found", () => {
            mongodb.exists = always(false);
            const instance = {
                name: "collectionName",
                kinesisStreamName: "kinesisStreamName"
            };
            const id = "id";
            const element = {};
            const promise = handlers.replace.call(instance, id, element);
            return expect(getErrorFromPromise(promise)).to.become({
                code: 404,
                message: "NotFoundError",
                details: undefined
            });
        });

        it("returns null", () => {
            mongodb.exists = always(true);
            const instance = {
                name: "collectionName",
                kinesisStreamName: "kinesisStreamName"
            };
            const id = "id";
            const element = {};
            return handlers.replace.call(instance, id, element)
                .then(result => {
                    expect(result === null).to.equal(true);
                });
        });

        it("strips `id` and `_id` from `element`", () => {
            mongodb.exists = always(true);
            const instance = {
                name: "collectionName",
                kinesisStreamName: "kinesisStreamName"
            };
            const id = "id";
            const element = {_id: "id", id: "id"};
            return handlers.replace.call(instance, id, element)
                .then(() => {
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
                        PartitionKey: "collectionNameid",
                        StreamName: "kinesisStreamName"
                    });
                });
        });

        it("publishes a `replaced` event to kinesis", () => {
            mongodb.exists = always(true);
            const instance = {
                name: "collectionName",
                kinesisStreamName: "kinesisStreamName"
            };
            const id = "id";
            const element = {};
            return handlers.replace.call(instance, id, element)
                .then(() => {
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
                        PartitionKey: "collectionNameid",
                        StreamName: "kinesisStreamName"
                    });
                });
        });

    });

    describe("remove", () => {

        it("throws a 404 if no element is found", () => {
            mongodb.exists = always(false);
            const instance = {
                name: "collectionName",
                kinesisStreamName: "kinesisStreamName"
            };
            const id = "id";
            const promise = handlers.remove.call(instance, id);
            return expect(getErrorFromPromise(promise)).to.become({
                code: 404,
                message: "NotFoundError",
                details: undefined
            });
        });

        it("returns null", () => {
            mongodb.exists = always(true);
            const instance = {
                name: "collectionName",
                kinesisStreamName: "kinesisStreamName"
            };
            const id = "id";
            return handlers.remove.call(instance, id)
                .then(result => {
                    expect(result === null).to.equal(true);
                });
        });

        it("publishes a `removed` event to kinesis", () => {
            mongodb.exists = always(true);
            const instance = {
                name: "collectionName",
                kinesisStreamName: "kinesisStreamName"
            };
            const id = "id";
            return handlers.remove.call(instance, id)
                .then(() => {
                    expect(kinesis.putRecord).to.have.been.calledWith({
                        Data: JSON.stringify({
                            id: "id",
                            data: {
                                id: "id"
                            },
                            timestamp: "1970-01-01T00:00:00.000Z",
                            type: "element removed in collection collectionName"
                        }),
                        PartitionKey: "collectionNameid",
                        StreamName: "kinesisStreamName"
                    });
                });
        });

    });

    describe("findOne", () => {

        it("returns the element with the provided id (if any)", () => {
            mongodb.findOne = always(resolve({id: "myId"}));
            const instance = {
                name: "collectionName",
                kinesisStreamName: "kinesisStreamName"
            };
            const id = "myId";
            return handlers.findOne.call(instance, id)
                .then(result => {
                    expect(result).to.deep.equal({id: "myId"});
                });
        });

    });

});
