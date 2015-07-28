import chai, {expect} from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(sinonChai);

import producer from "producer";

describe("`processApiGatewayEvent`", function () {

    var insert = sinon.spy();
    var remove = sinon.spy();
    var replace = sinon.spy();

    before(function () {
        producer.__Rewire__("insert", insert);
        producer.__Rewire__("remove", remove);
        producer.__Rewire__("replace", replace);
    });

    after(function () {
        producer.__ResetDependency__("insert");
        producer.__ResetDependency__("remove");
        producer.__ResetDependency__("replace");
    });

    it("calls the correct function based on the `method` property of the event", function () {
        var instance = {
            name: "name"
        };
        var processApiGatewayEvent = producer.__get__("processApiGatewayEvent");
        // Insert
        processApiGatewayEvent.call(instance, {
            method: "/name/insert",
            params: ["insert", "name"]
        });
        expect(insert).to.have.been.calledWith("insert", "name");
        // Remove
        processApiGatewayEvent.call(instance, {
            method: "/name/remove",
            params: ["remove", "name"]
        });
        expect(remove).to.have.been.calledWith("remove", "name");
        // Replace
        processApiGatewayEvent.call(instance, {
            method: "/name/replace",
            params: ["replace", "name"]
        });
        expect(replace).to.have.been.calledWith("replace", "name");
    });

});

describe("`insert`, `remove` and `replace` functions", function () {

    var kinesis = {
        putRecord: sinon.spy()
    };

    before(function () {
        producer.__Rewire__("kinesis", kinesis);
        sinon.stub(Date, "now").returns(0);
    });

    after(function () {
        producer.__ResetDependency__("kinesis");
        Date.now.restore();
    });

    beforeEach(function () {
        kinesis.putRecord.reset();
    });

    describe("`insert`", function () {

        it("adds insert record to kinesis stream", function () {
            var instance = {
                name: "name",
                kinesisStreamName: "STREAM_NAME"
            };
            var insert = producer.__get__("insert");
            insert.call(instance, {key: "value"});
            expect(kinesis.putRecord).to.have.been.calledWith({
                Data: JSON.stringify({
                    data: {
                        element: {key: "value"}
                    },
                    timestamp: 0,
                    type: "/name/insert"
                }),
                PartitionKey: "name",
                StreamName: "STREAM_NAME"
            });
        });

    });

    describe("`remove`", function () {

        it("adds remove record to kinesis stream", function () {
            var instance = {
                name: "name",
                kinesisStreamName: "STREAM_NAME"
            };
            var remove = producer.__get__("remove");
            remove.call(instance, "id");
            expect(kinesis.putRecord).to.have.been.calledWith({
                Data: JSON.stringify({
                    data: {
                        id: "id"
                    },
                    timestamp: 0,
                    type: "/name/remove"
                }),
                PartitionKey: "name",
                StreamName: "STREAM_NAME"
            });
        });

    });

    describe("`replace`", function () {

        it("adds replace record to kinesis stream", function () {
            var instance = {
                name: "name",
                kinesisStreamName: "STREAM_NAME"
            };
            var replace = producer.__get__("replace");
            replace.call(instance, "id", {
                replacedKey: "replacedValue"
            });
            expect(kinesis.putRecord).to.have.been.calledWith({
                Data: JSON.stringify({
                    data: {
                        id: "id",
                        element: {
                            replacedKey: "replacedValue"
                        }
                    },
                    timestamp: 0,
                    type: "/name/replace"
                }),
                PartitionKey: "name",
                StreamName: "STREAM_NAME"
            });
        });

    });

});
