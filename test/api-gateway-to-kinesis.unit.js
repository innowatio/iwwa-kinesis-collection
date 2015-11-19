import BPromise from "bluebird";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
import merge from "ramda";
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

        before(function () {
            apiGatewayToKinesis.__Rewire__("mongodb", mongodb);
        });

        it("attachs the user at the request object if authorized", function () {
            var instance = {
                mongodbUrl: "mongodbUrl",
                mongodbCollectionName: "collectionName"
            };
            var request = {"token": "t3htoken"};
            const authenticate = apiGatewayToKinesis.__get__("authenticate");
            const promise = authenticate.call(instance, request);
            return expect(promise).to.become({...request, user});
        });
    });

});
