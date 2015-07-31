import chai, {expect} from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(sinonChai);

import kinesisToDynamodb from "kinesis-to-dynamodb";

describe("`kinesisToDynamodb`", function () {

    var dynamodb = {
        putItem: sinon.spy(),
        deleteItem: sinon.spy()
    };

    before(function () {
        kinesisToDynamodb.__Rewire__("dynamodb", dynamodb);
    });

    after(function () {
        kinesisToDynamodb.__ResetDependency__("dynamodb");
    });

    beforeEach(function () {
        dynamodb.putItem.reset();
        dynamodb.deleteItem.reset();
    });

    describe("`put`", function () {

        it("puts the supplied item into dynamodb", function () {
            var instance = {
                dynamodbTableName: "TABLE_NAME"
            };
            var put = kinesisToDynamodb.__get__("put");
            put.call(instance, {
                data: {
                    element: {
                        key: "value"
                    },
                    id: "id"
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

        it("deletes the supplied item from dynamodb", function () {
            var instance = {
                dynamodbTableName: "TABLE_NAME"
            };
            var remove = kinesisToDynamodb.__get__("remove");
            remove.call(instance, {
                data: {
                    id: "id"
                }
            });
            expect(dynamodb.deleteItem).to.have.been.calledWith({
                Key: {
                    id: "id"
                },
                TableName: "TABLE_NAME"
            });
        });

    });

});
