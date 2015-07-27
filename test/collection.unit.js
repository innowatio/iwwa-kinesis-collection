import chai, {expect} from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(sinonChai);

import Collection from "collection";

describe("`processEvent` method", function () {

    it("calls the correct method based on the `method` property of the event", function () {
        var c = new Collection("name");
        // Insert
        c.insert = sinon.spy();
        c.processEvent({
            method: "/name/insert",
            params: ["insert", "name"]
        });
        expect(c.insert).to.have.been.calledWith("insert", "name");
        // Remove
        c.remove = sinon.spy();
        c.processEvent({
            method: "/name/remove",
            params: ["remove", "name"]
        });
        expect(c.remove).to.have.been.calledWith("remove", "name");
        // Replace
        c.replace = sinon.spy();
        c.processEvent({
            method: "/name/replace",
            params: ["replace", "name"]
        });
        expect(c.replace).to.have.been.calledWith("replace", "name");
    });

});

describe("`insert`, `remove` and `replace` methods", function () {

    var kinesis = {
        putRecordAsync: sinon.spy()
    };

    before(function () {
        Collection.__Rewire__("kinesis", kinesis);
        sinon.stub(Date, "now").returns(0);
    });

    after(function () {
        Collection.__ResetDependency__("kinesis");
        Date.now.restore();
    });

    beforeEach(function () {
        kinesis.putRecordAsync.reset();
    });

    describe("`insert`", function () {

        it("adds insert record to kinesis stream", function () {
            var c = new Collection("name", "STREAM_NAME");
            c.insert({key: "value"});
            expect(kinesis.putRecordAsync).to.have.been.calledWith({
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
            var c = new Collection("name", "STREAM_NAME");
            c.remove("id");
            expect(kinesis.putRecordAsync).to.have.been.calledWith({
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
            var c = new Collection("name", "STREAM_NAME");
            c.replace("id", "version", {
                replacedKey: "replacedValue"
            });
            expect(kinesis.putRecordAsync).to.have.been.calledWith({
                Data: JSON.stringify({
                    data: {
                        id: "id",
                        version: "version",
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
