import chai, {expect} from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(sinonChai);

import jsonRpcToKinesis from "json-rpc-to-kinesis";

describe("`jsonRpcToKinesis`", function () {

    describe("`processRpc`", function () {

        var insert = sinon.spy();
        var remove = sinon.spy();
        var replace = sinon.spy();

        before(function () {
            jsonRpcToKinesis.__Rewire__("insert", insert);
            jsonRpcToKinesis.__Rewire__("remove", remove);
            jsonRpcToKinesis.__Rewire__("replace", replace);
        });

        after(function () {
            jsonRpcToKinesis.__ResetDependency__("insert");
            jsonRpcToKinesis.__ResetDependency__("remove");
            jsonRpcToKinesis.__ResetDependency__("replace");
        });

        it("calls the correct function based on the `method` property of the event", function () {
            var instance = {
                name: "name"
            };
            var processRpc = jsonRpcToKinesis.__get__("processRpc");
            // Insert
            processRpc.call(instance, {
                method: "/name/insert",
                params: ["insert", "name"]
            });
            expect(insert).to.have.been.calledWith("insert", "name");
            // Remove
            processRpc.call(instance, {
                method: "/name/remove",
                params: ["remove", "name"]
            });
            expect(remove).to.have.been.calledWith("remove", "name");
            // Replace
            processRpc.call(instance, {
                method: "/name/replace",
                params: ["replace", "name"]
            });
            expect(replace).to.have.been.calledWith("replace", "name");
        });

    });

    describe("`insert`", function () {

        var kinesis = {
            putRecord: sinon.spy()
        };

        var uuid = {
            v4: sinon.stub().returns("id")
        };

        before(function () {
            jsonRpcToKinesis.__Rewire__("kinesis", kinesis);
            jsonRpcToKinesis.__Rewire__("uuid", uuid);
            sinon.stub(Date, "now").returns(0);
        });

        after(function () {
            jsonRpcToKinesis.__ResetDependency__("kinesis");
            jsonRpcToKinesis.__ResetDependency__("uuid");
            Date.now.restore();
        });

        beforeEach(function () {
            kinesis.putRecord.reset();
        });

        it("adds insert record to kinesis stream", function () {
            var instance = {
                name: "name",
                kinesisStreamName: "STREAM_NAME"
            };
            var insert = jsonRpcToKinesis.__get__("insert");
            insert.call(instance, {key: "value"});
            expect(kinesis.putRecord).to.have.been.calledWith({
                Data: JSON.stringify({
                    data: {
                        element: {key: "value"},
                        id: "id"
                    },
                    timestamp: 0,
                    type: "element inserted in collection name"
                }),
                PartitionKey: "name",
                StreamName: "STREAM_NAME"
            });
        });

    });

    describe("`remove`", function () {

        var kinesis = {
            putRecord: sinon.spy()
        };

        before(function () {
            jsonRpcToKinesis.__Rewire__("kinesis", kinesis);
            sinon.stub(Date, "now").returns(0);
        });

        after(function () {
            jsonRpcToKinesis.__ResetDependency__("kinesis");
            Date.now.restore();
        });

        beforeEach(function () {
            kinesis.putRecord.reset();
        });

        it("adds remove record to kinesis stream", function () {
            var instance = {
                name: "name",
                kinesisStreamName: "STREAM_NAME"
            };
            var remove = jsonRpcToKinesis.__get__("remove");
            remove.call(instance, "id");
            expect(kinesis.putRecord).to.have.been.calledWith({
                Data: JSON.stringify({
                    data: {
                        id: "id"
                    },
                    timestamp: 0,
                    type: "element removed in collection name"
                }),
                PartitionKey: "name",
                StreamName: "STREAM_NAME"
            });
        });

    });

    describe("`replace`", function () {

        var kinesis = {
            putRecord: sinon.spy()
        };

        before(function () {
            jsonRpcToKinesis.__Rewire__("kinesis", kinesis);
            sinon.stub(Date, "now").returns(0);
        });

        after(function () {
            jsonRpcToKinesis.__ResetDependency__("kinesis");
            Date.now.restore();
        });

        beforeEach(function () {
            kinesis.putRecord.reset();
        });

        it("adds replace record to kinesis stream", function () {
            var instance = {
                name: "name",
                kinesisStreamName: "STREAM_NAME"
            };
            var replace = jsonRpcToKinesis.__get__("replace");
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
                    type: "element replaced in collection name"
                }),
                PartitionKey: "name",
                StreamName: "STREAM_NAME"
            });
        });

    });

});
