import chai, {expect} from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(sinonChai);

import consumer from "consumer";

describe("`insert`, `remove` and `replace` functions", function () {

    var dynamodb = {
        putItem: sinon.spy(),
        deleteItem: sinon.spy()
    };

    var uuid = {
        v4: sinon.stub().returns("id")
    };

    before(function () {
        consumer.__Rewire__("dynamodb", dynamodb);
        consumer.__Rewire__("uuid", uuid);
    });

    after(function () {
        consumer.__ResetDependency__("dynamodb");
        consumer.__ResetDependency__("uuid");
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
                data: {
                    element: {
                        key: "value"
                    }
                }
            });
            expect(dynamodb.putItem).to.have.been.calledWith({
                Item: {
                    key: "value",
                    id: "id"
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
                data: {
                    id: "id"
                }
            });
            expect(dynamodb.deleteItem).to.have.been.calledWith({
                Key: {
                    id: {
                        S: "id"
                    }
                },
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
                data: {
                    id: "id",
                    element: {
                        key: "value"
                    }
                }
            });
            expect(dynamodb.putItem).to.have.been.calledWith({
                Item: {
                    id: "id",
                    key: "value"
                },
                TableName: "TABLE_NAME"
            });
        });

    });

});
