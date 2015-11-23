import {all, resolve, reject} from "bluebird";
import chai, {expect} from "chai";
import chaiAsPromised from "chai-as-promised";
import {always} from "ramda";
import sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(chaiAsPromised);
chai.use(sinonChai);

import {getErrorFromFunction, getErrorFromPromise} from "../test-utils";
import RequestError from "api-gateway-to-kinesis/request-error";
import apiGatewayToKinesis from "api-gateway-to-kinesis";

describe("apiGatewayToKinesis", () => {

    describe("validate", () => {

        const validate = apiGatewayToKinesis.__get__("validate");
        const request = {body: {element: 2}};

        it("if the request body is valid, returns the request", () => {
            const instance = {
                validateSchema: always({
                    isValid: true,
                    errors: null
                })
            };
            const ret = validate.call(instance, request);
            expect(ret).to.equal(request);
        });

        it("if the request body is not valid, throws a `ValidationError`", () => {
            const instance = {
                validateSchema: always({
                    isValid: false,
                    errors: "Errors"
                })
            };
            const troublemaker = validate.bind(instance, request);
            expect(troublemaker).to.throw(RequestError);
            expect(getErrorFromFunction(troublemaker)).to.deep.equal({
                code: 400,
                message: "ValidationError",
                details: "Errors"
            });
        });
    });

    describe("authenticate", () => {

        const authenticate = apiGatewayToKinesis.__get__("authenticate");
        const mongodb = {};
        const instance = {
            mongodbUrl: "mongodbUrl"
        };
        const request = {token: "t3htoken"};

        before(() => {
            apiGatewayToKinesis.__Rewire__("mongodb", mongodb);
        });
        after(() => {
            apiGatewayToKinesis.__ResetDependency__("mongodb");
        });

        it("if the request has no token, returns the request", () => {
            const requestWithoutToken = {};
            const ret = authenticate(requestWithoutToken);
            expect(ret).to.equal(requestWithoutToken);
        });

        it("calls the `findOne` function with the correct parameter", () => {
            mongodb.findOne = sinon.stub().returns(resolve({}));
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

        it("if a user is found, attaches the user to the request object", () => {
            const user = {_id: "id"};
            mongodb.findOne = sinon.stub().returns(resolve(user));
            const promise = authenticate.call(instance, request);
            return expect(promise).to.become({...request, user});
        });

        it("if no user is found, throws an `AuthenticationError`", () => {
            mongodb.findOne = sinon.stub().returns(resolve());
            const promise = authenticate.call(instance, request);
            return all([
                expect(promise).to.be.rejectedWith(RequestError),
                expect(getErrorFromPromise(promise)).to.become({
                    code: 401,
                    message: "AuthenticationError",
                    details: "Invalid token"
                })
            ]);
        });

    });

    describe("authorize", () => {

        const authorize = apiGatewayToKinesis.__get__("authorize");

        it("if the request is authorized, returns the given request", () => {
            const instance = {
                authorizeApiRequest: always(resolve())
            };
            const request = {};
            const promise = authorize.call(instance, request);
            return expect(promise).to.become(request);
        });

        it("if the request is not authorized, throws an `AuthorizationError`", () => {
            const instance = {
                authorizeApiRequest: always(reject(new Error("Message")))
            };
            const request = {};
            const promise = authorize.call(instance, request);
            return all([
                expect(promise).to.be.rejectedWith(RequestError),
                expect(getErrorFromPromise(promise)).to.become({
                    code: 403,
                    message: "AuthorizationError",
                    details: "Message"
                })
            ]);
        });
    });

    describe("handle", () => {

        const insert = sinon.spy();
        const replace = sinon.spy();
        const remove = sinon.spy();
        const handle = apiGatewayToKinesis.__get__("handle");

        before(() => {
            apiGatewayToKinesis.__Rewire__("insert", insert);
            apiGatewayToKinesis.__Rewire__("replace", replace);
            apiGatewayToKinesis.__Rewire__("remove", remove);
        });
        after(() => {
            apiGatewayToKinesis.__ResetDependency__("insert");
            apiGatewayToKinesis.__ResetDependency__("replace");
            apiGatewayToKinesis.__ResetDependency__("remove");
        });
        beforeEach(() => {
            insert.reset();
            replace.reset();
            remove.reset();
        });

        it("calls `insert` on `POST`s", () => {
            const request = {
                method: "POST",
                body: {}
            };
            const instance = {};
            handle.call(instance, request);
            expect(insert).to.have.callCount(1);
            expect(insert).to.have.calledWith({});
            expect(insert).to.have.calledOn(instance);
        });

        it("calls `replace` on `PUT`s", () => {
            const request = {
                method: "PUT",
                body: {}
            };
            const instance = {};
            handle.call(instance, request);
            expect(replace).to.have.callCount(1);
            expect(replace).to.have.calledWith({});
            expect(replace).to.have.calledOn(instance);
        });

        it("calls `remove` on `DELETE`s", () => {
            const request = {
                method: "DELETE",
                body: {}
            };
            const instance = {};
            handle.call(instance, request);
            expect(remove).to.have.callCount(1);
            expect(remove).to.have.calledWith({});
            expect(remove).to.have.calledOn(instance);
        });

        it("throws a `MethodError` otherwise", () => {
            const request = {
                body: "body",
                method: "HEAD"
            };
            const instance = {};
            const troublemaker = handle.bind(instance, request);
            expect(troublemaker).to.throw(RequestError);
            expect(getErrorFromFunction(troublemaker)).to.deep.equal({
                code: 400,
                message: "MethodError",
                details: "Unsupported method HEAD"
            });
        });

    });

    describe("pipeline", () => {

        const pipeline = apiGatewayToKinesis.__get__("pipeline");
        const validate = sinon.spy();
        const authenticate = sinon.spy();
        const authorize = sinon.spy();
        const handle = sinon.spy();

        before(() => {
            apiGatewayToKinesis.__Rewire__("validate", validate);
            apiGatewayToKinesis.__Rewire__("authenticate", authenticate);
            apiGatewayToKinesis.__Rewire__("authorize", authorize);
            apiGatewayToKinesis.__Rewire__("handle", handle);
        });
        after(() => {
            apiGatewayToKinesis.__ResetDependency__("validate");
            apiGatewayToKinesis.__ResetDependency__("authenticate");
            apiGatewayToKinesis.__ResetDependency__("authorize");
            apiGatewayToKinesis.__ResetDependency__("handle");
        });
        beforeEach(() => {
            validate.reset();
            authenticate.reset();
            authorize.reset();
            handle.reset();
        });

        it("calls in order `validate`, `authenticate`, `authorize` and `handle`", () => {
            return pipeline().then(() => {
                expect(validate).to.have.been.calledBefore(authenticate);
                expect(authenticate).to.have.been.calledBefore(authorize);
                expect(authorize).to.have.been.calledBefore(handle);
            });
        });

        it("binds those functions to its contexts", () => {
            const instance = {};
            return pipeline.call(instance).then(() => {
                expect(validate).to.have.been.calledOn(instance);
                expect(authenticate).to.have.been.calledOn(instance);
                expect(authorize).to.have.been.calledOn(instance);
            });
        });

    });

    describe("apiGatewayToKinesis", () => {

        const context = {
            succeed: sinon.spy(),
            fail: sinon.spy()
        };

        afterEach(() => {
            apiGatewayToKinesis.__ResetDependency__("pipeline");
            context.succeed.reset();
            context.fail.reset();
        });

        it("calls `context.succeed` if the pipeline resolves", () => {
            const resolvingPipeline = always(resolve({}));
            apiGatewayToKinesis.__Rewire__("pipeline", resolvingPipeline);
            return apiGatewayToKinesis({}, context).then(() => {
                expect(context.succeed).to.have.been.calledWith({});
            });
        });

        it("calls `context.fail` if the pipeline rejects (1 of 2)", () => {
            const rejectingPipeline = always(reject(
                new RequestError(400, "Message", "Details")
            ));
            apiGatewayToKinesis.__Rewire__("pipeline", rejectingPipeline);
            return apiGatewayToKinesis({}, context).then(() => {
                expect(context.fail).to.have.been.calledWith({
                    code: 400,
                    message: "Message",
                    details: "Details"
                });
            });
        });

        it("calls `context.fail` if the pipeline rejects (2 of 2)", () => {
            const rejectingPipeline = always(reject(
                new Error("Message")
            ));
            apiGatewayToKinesis.__Rewire__("pipeline", rejectingPipeline);
            return apiGatewayToKinesis({}, context).then(() => {
                expect(context.fail).to.have.been.calledWith({
                    code: 500,
                    message: "Internal server error",
                    details: undefined
                });
            });
        });

    });

});
