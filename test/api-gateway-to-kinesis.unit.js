import BPromise from "bluebird";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import sinonChai from "sinon-chai";

import RequestError from "../src/api-gateway-to-kinesis/request-error";

chai.use(chaiAsPromised);
chai.use(sinonChai);

import apiGatewayToKinesis from "api-gateway-to-kinesis";

describe("`apiGatewayToKinesis`", function () {

    describe("`validate`", function () {

        it("returns the request if the request body is valid", function () {
            apiGatewayToKinesis.__Rewire__("checkSchema", sinon.stub().returns(true));
            var validate = apiGatewayToKinesis.__get__("validate");
            var instance = {
                schema: {}
            };
            var request = {"body": {"element": 2}};
            expect(validate.call(instance, request)).to.be.equals(request);
        });

        it("throws a `ValidationError` if the request body is not valid", function () {
            apiGatewayToKinesis.__Rewire__("checkSchema", sinon.stub().returns(false));
            var validate = apiGatewayToKinesis.__get__("validate");
            var instance = {
                schema: {}
            };
            var request = {"body": {"element": 2}};
            const troublemaker = () => {
                validate.call(instance, request);
            };
            expect(troublemaker).to.throw("ValidationError");
            expect(troublemaker).to.throw(RequestError);
        });
    });

    describe("`authorize`", function () {

        it("if the user is authorized return the given request", function () {
            const authorize = apiGatewayToKinesis.__get__("authorize");
            const instance = {
                authorizeApiRequest: sinon.stub().returns(
                    BPromise.resolve(true))
            };
            const request = {};
            const promise = authorize.call(instance, request);
            return expect(promise).to.become(request);
        });

        it("if the user is not authorized throw an `Authentication Error`", function () {
            const authorize = apiGatewayToKinesis.__get__("authorize");
            const instance = {
                authorizeApiRequest: sinon.stub().returns(
                    BPromise.resolve(false)
                )
            };
            const request = {};
            const promise = authorize.call(instance, request);
            return expect(promise).to.be.rejectedWith("AuthorizationError");
        });
    });

    describe("`authenticate`", function () {

        const user = {
            "_id": "user_id"
        };
        const mongodb = {
            findOne: sinon.stub().returns(
                BPromise.resolve(user)
            )
        };
        const instance = {
            mongodbUrl: "mongodbUrl"
        };
        const request = {token: "t3htoken"};
        var authenticate;

        beforeEach(function () {
            authenticate = apiGatewayToKinesis.__get__("authenticate");
            mongodb.findOne.reset();
            apiGatewayToKinesis.__Rewire__("mongodb", mongodb);
        });

        afterEach(function () {
            apiGatewayToKinesis.__ResetDependency__("mongodb");
        });

        it("should call the findOne function with the correct parameter", function () {
            const expectedParameter = {
                url: "mongodbUrl",
                query: {
                    "services.resume.loginTokens.hashedToken": "t3htoken"
                },
                collectionName: "users"
            };
            authenticate.call(instance, request);
            expect(mongodb.findOne).to.have.callCount(1);
            expect(mongodb.findOne).to.have.been.calledWith(expectedParameter);
        });

        it("attachs the user at the request object if authorized", function () {
            const promise = authenticate.call(instance, request);
            return expect(promise).to.become({...request, user});
        });

    });

    describe("`handle`", function () {

        const insert = sinon.spy();
        const replace = sinon.spy();
        const remove = sinon.spy();
        var handle;

        beforeEach(function () {
            handle = apiGatewayToKinesis.__get__("handle");
            insert.reset();
            apiGatewayToKinesis.__Rewire__("insert", insert);
            replace.reset();
            apiGatewayToKinesis.__Rewire__("replace", replace);
            remove.reset();
            apiGatewayToKinesis.__Rewire__("remove", remove);
        });

        afterEach(function () {
            apiGatewayToKinesis.__ResetDependency__("insert");
            apiGatewayToKinesis.__ResetDependency__("replace");
            apiGatewayToKinesis.__ResetDependency__("remove");

        });

        it("should call the `insert` function with the correct parameter if the `request` handle the `POST` method", function () {
            const request = {
                method: "POST",
                body: "body"
            };
            const instance = {};
            handle.call(instance, request);
            expect(insert).to.have.callCount(1);
            expect(insert).to.have.calledWith("body");
            expect(insert).to.have.calledOn(instance);
        });

        it("should call the `replace` function with the correct parameter if the `request` handle the `PUT` method", function () {
            const request = {
                method: "PUT",
                body: "body"
            };
            const instance = {};
            handle.call(instance, request);
            expect(replace).to.have.callCount(1);
            expect(replace).to.have.calledWith("body");
            expect(replace).to.have.calledOn(instance);
        });

        it("should call the `remove` function with the correct parameter if the `request` handle the `DELETE` method", function () {
            const request = {
                method: "DELETE",
                body: "body"
            };
            const instance = {};
            handle.call(instance, request);
            expect(remove).to.have.callCount(1);
            expect(remove).to.have.calledWith("body");
            expect(remove).to.have.calledOn(instance);
        });

        it("should call the `insert` function with the correct parameter if the `request` handle the `POST` method", function () {
            const request = {
                body: "body"
            };
            const instance = {};
            const troublemaker = () => {
                handle.call(instance, request);
            };
            expect(troublemaker).to.throw("MethodError");
        });

    });

});
