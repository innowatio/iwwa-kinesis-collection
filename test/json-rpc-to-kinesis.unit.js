import BPromise from "bluebird";
import chai, {expect} from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(sinonChai);

/*
*   TODO: figure out what the hell is goind on with importing `ValidationError`
*   from `src/index.js`.
*
*   If I import it before importing the `json-rpc-to-kinesis` module,
*   `ValidationError` in module `json-rpc-to-kinesis` is undefined.
*
*   If I import it after importing the `json-rpc-to-kinesis` module,
*   `ValidationError` in this module is undefined the first time it runs. The
*   following times - once babeljs has a cache - it is defined, so it works.
*   (In Travis since "it's always the first time" it's always undefined, hence
*   the build failure.)
*
*   It's most likely a bug in babeljs, but I have no time to figure it out now.
*   I work around the issue just commenting out the test on ValidationError.
*/
import jsonRpcToKinesis from "json-rpc-to-kinesis";
// import {ValidationError} from "index";

describe("`jsonRpcToKinesis`", function () {

    describe("`jsonRpcToKinesis`", function () {
        var processRpc = sinon.spy();

        before(function () {
            jsonRpcToKinesis.__Rewire__("processRpc", processRpc);
        });

        after(function () {
            jsonRpcToKinesis.__ResetDependency__("processRpc");
        });

        beforeEach(function () {
            processRpc.reset();
        });

        it("validates the rpc", function () {
            var instance = {
                validateRpc: sinon.stub().returns(BPromise.reject())
            };
            var evt = {id: 0};
            var context = {
                fail: sinon.spy()
            };
            return jsonRpcToKinesis.call(instance, evt, context).then(function () {
                expect(instance.validateRpc).to.have.been.calledWith({id: 0});
            });
        });

        it("calls the `processRpc` function if the validation is successfuil", function () {
            var instance = {
                validateRpc: sinon.stub().returns(BPromise.resolve())
            };
            var evt = {id: 0};
            var context = {
                succeed: sinon.spy()
            };
            return jsonRpcToKinesis.call(instance, evt, context).then(function () {
                expect(processRpc).to.have.been.calledWith({id: 0});
            });
        });

        it("doesn't call the `processRpc` function if the validation is not successfuil", function () {
            var instance = {
                validateRpc: sinon.stub().returns(BPromise.reject())
            };
            var evt = {id: 0};
            var context = {
                fail: sinon.spy()
            };
            return jsonRpcToKinesis.call(instance, evt, context).then(function () {
                expect(processRpc).to.have.callCount(0);
            });
        });

        it("calls `context.succeed` if all went well", function () {
            var instance = {
                validateRpc: sinon.stub().returns(BPromise.resolve())
            };
            var evt = {id: 0};
            var context = {
                succeed: sinon.spy()
            };
            return jsonRpcToKinesis.call(instance, evt, context).then(function () {
                expect(context.succeed).to.have.been.calledWith({
                    id: 0,
                    result: null
                });
            });
        });

        // See top comment on why this is commented out
        // it("calls `context.fail` if an error occurred (ValidationError)", function () {
        //     var instance = {
        //         validateRpc: sinon.stub().returns(BPromise.reject(
        //             new ValidationError(400, "Bad request")
        //         ))
        //     };
        //     var evt = {id: 0};
        //     var context = {
        //         fail: sinon.spy()
        //     };
        //     return jsonRpcToKinesis.call(instance, evt, context).then(function () {
        //         expect(context.fail).to.have.been.calledWith({
        //             id: 0,
        //             error: {
        //                 code: 400,
        //                 message: "Bad request"
        //             }
        //         });
        //     });
        // });

        it("calls `context.fail` if an error occurred (non-ValidationError)", function () {
            var instance = {
                validateRpc: sinon.stub().returns(BPromise.reject())
            };
            var evt = {id: 0};
            var context = {
                fail: sinon.spy()
            };
            return jsonRpcToKinesis.call(instance, evt, context).then(function () {
                expect(context.fail).to.have.been.calledWith({
                    id: 0,
                    error: {
                        code: 500,
                        message: "Internal server error"
                    }
                });
            });
        });

    });

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
                    id: "id",
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

        it("adds remove record to kinesis stream", function () {
            var instance = {
                name: "name",
                kinesisStreamName: "STREAM_NAME"
            };
            var remove = jsonRpcToKinesis.__get__("remove");
            remove.call(instance, "id");
            expect(kinesis.putRecord).to.have.been.calledWith({
                Data: JSON.stringify({
                    id: "id",
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
                    id: "id",
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
