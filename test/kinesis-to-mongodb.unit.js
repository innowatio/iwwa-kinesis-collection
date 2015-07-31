import chai, {expect} from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(sinonChai);

import kinesisToMongodb from "kinesis-to-mongodb";

describe("`kinesisToMongodb`", function () {

    var mongodb = {
        upsert: sinon.spy(),
        remove: sinon.spy()
    };

    before(function () {
        kinesisToMongodb.__Rewire__("mongodb", mongodb);
    });

    after(function () {
        kinesisToMongodb.__ResetDependency__("mongodb");
    });

    beforeEach(function () {
        mongodb.upsert.reset();
        mongodb.remove.reset();
    });

    describe("`upsert`", function () {

        it("upserts the supplied item into mongodb", function () {
            var instance = {
                mongodbUrl: "mongodbUrl",
                mongodbCollectionName: "collectionName"
            };
            var upsert = kinesisToMongodb.__get__("upsert");
            upsert.call(instance, {
                data: {
                    element: {
                        key: "value"
                    },
                    id: "id"
                }
            });
            expect(mongodb.upsert).to.have.been.calledWith({
                url: "mongodbUrl",
                collectionName: "collectionName",
                query: {
                    _id: "id"
                },
                element: {
                    _id: "id",
                    key: "value"
                }
            });
        });

    });

    describe("`remove`", function () {

        it("removes the supplied item from mongodb", function () {
            var instance = {
                mongodbUrl: "mongodbUrl",
                mongodbCollectionName: "collectionName"
            };
            var remove = kinesisToMongodb.__get__("remove");
            remove.call(instance, {
                data: {
                    id: "id"
                }
            });
            expect(mongodb.remove).to.have.been.calledWith({
                url: "mongodbUrl",
                collectionName: "collectionName",
                query: {
                    _id: "id"
                }
            });
        });

    });

});
