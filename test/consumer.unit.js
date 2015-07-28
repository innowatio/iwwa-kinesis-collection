import chai, {expect} from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(sinonChai);

import consumer from "consumer";

describe("`processKinesisEvent`", function () {

    var insert = sinon.spy();
    var remove = sinon.spy();
    var replace = sinon.spy();

    before(function () {
        consumer.__Rewire__("insert", insert);
        consumer.__Rewire__("remove", remove);
        consumer.__Rewire__("replace", replace);
    });

    after(function () {
        consumer.__ResetDependency__("insert");
        consumer.__ResetDependency__("remove");
        consumer.__ResetDependency__("replace");
    });

    it("calls the correct function based on the `type` property of the application event", function () {
        var instance = {
            name: "name"
        };
        var processKinesisEvent = consumer.__get__("processKinesisEvent");
        // Insert
        processKinesisEvent.call(instance, {
            Records: [{
                kinesis: {
                    data: new Buffer(JSON.stringify({
                        type: "/name/insert",
                        data: "insert"
                    })).toString("base64")
                }
            }]
        });
        expect(insert).to.have.been.calledWith("insert");
        // Remove
        processKinesisEvent.call(instance, {
            Records: [{
                kinesis: {
                    data: new Buffer(JSON.stringify({
                        type: "/name/remove",
                        data: "remove"
                    })).toString("base64")
                }
            }]
        });
        expect(remove).to.have.been.calledWith("remove");
        // Replace
        processKinesisEvent.call(instance, {
            Records: [{
                kinesis: {
                    data: new Buffer(JSON.stringify({
                        type: "/name/replace",
                        data: "replace"
                    })).toString("base64")
                }
            }]
        });
        expect(replace).to.have.been.calledWith("replace");
    });

});

describe("`insert`, `remove` and `replace` functions", function () {

    var dynamodb = {
        putItem: sinon.spy(),
        deleteItem: sinon.spy()
    };

    var uuid = {
        v4: sinon.stub().returns("id")
    };

    var hashObj = sinon.stub().returns("hash");

    before(function () {
        consumer.__Rewire__("dynamodb", dynamodb);
        consumer.__Rewire__("uuid", uuid);
        consumer.__Rewire__("hashObj", hashObj);
    });

    after(function () {
        consumer.__ResetDependency__("dynamodb");
        consumer.__ResetDependency__("uuid");
        consumer.__ResetDependency__("hashObj");
    });

    beforeEach(function () {
        dynamodb.putItem.reset();
        dynamodb.deleteItem.reset();
    });

    describe("`insert`", function () {

        it("puts a new item into dynamodb", function () {
            var instance = {
                dynamodbTableName: "TABLE_NAME"
            };
            var insert = consumer.__get__("insert");
            insert.call(instance, {
                element: {
                    key: "value"
                }
            });
            expect(dynamodb.putItem).to.have.been.calledWith({
                Item: {
                    key: "value",
                    id: "id",
                    version: "hash"
                },
                TableName: "TABLE_NAME"
            });
        });

    });

    describe("`remove`", function () {

        it("deletes the supplied item from dynamo", function () {
            var instance = {
                dynamodbTableName: "TABLE_NAME"
            };
            var remove = consumer.__get__("remove");
            remove.call(instance, {
                id: "id",
                version: "version"
            });
            expect(dynamodb.deleteItem).to.have.been.calledWith({
                Key: {
                    id: {
                        S: "id"
                    }
                },
                ExpressionAttributeNames: {
                    "#oldVersion": "version"
                },
                ExpressionAttributeValues: {
                    ":versionToUpdate": {
                        S: "version"
                    }
                },
                ConditionExpression: "#oldVersion = :versionToUpdate",
                TableName: "TABLE_NAME"
            });
        });

    });

    describe("`replace`", function () {

        it("puts the supplied item into dynamo", function () {
            var instance = {
                dynamodbTableName: "TABLE_NAME"
            };
            var replace = consumer.__get__("replace");
            replace.call(instance, {
                id: "id",
                version: "version",
                element: {
                    key: "value"
                }
            });
            expect(dynamodb.putItem).to.have.been.calledWith({
                Item: {
                    id: "id",
                    version: "hash",
                    key: "value"
                },
                ExpressionAttributeNames: {
                    "#oldVersion": "version"
                },
                ExpressionAttributeValues: {
                    ":versionToUpdate": {
                        S: "version"
                    }
                },
                ConditionExpression: "#oldVersion = :versionToUpdate",
                TableName: "TABLE_NAME"
            });
        });

    });

});
