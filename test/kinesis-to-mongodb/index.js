import chai, {expect} from "chai";
import {always} from "ramda";
import sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(sinonChai);

import kinesisToMongodb from "kinesis-to-mongodb";

describe("kinesisToMongodb", () => {

    const mongodb = {
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

    describe("upsert", () => {

        const upsert = kinesisToMongodb.__get__("upsert");

        it("upserts the supplied item into mongodb", () => {
            const instance = {
                mongodbUrl: "mongodbUrl",
                mongodbCollectionName: "collectionName"
            };
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

    describe("remove", () => {

        const remove = kinesisToMongodb.__get__("remove");

        it("removes the supplied item from mongodb", () => {
            const instance = {
                mongodbUrl: "mongodbUrl",
                mongodbCollectionName: "collectionName"
            };
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

    describe("kinesisToMongodb", () => {

        const router = {
            on: sinon.spy(() => router),
            call: sinon.spy()
        };
        const getRouter = always(router);

        before(() => {
            kinesisToMongodb.__Rewire__("router", getRouter);
        });
        after(() => {
            kinesisToMongodb.__ResetDependency__("router");
        });

        it("inits the router and calls it", () => {
            kinesisToMongodb.call({name: "name"});
            expect(router.on).to.have.callCount(3);
            expect(router.call).to.have.callCount(1);
        });

    });

});
