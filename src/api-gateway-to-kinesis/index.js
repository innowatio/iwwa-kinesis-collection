import {bind} from "bluebird";
import {clone, is} from "ramda";

import * as mongodb from "../services/mongodb";
import {insert, replace, remove} from "./handlers";
import RequestError from "./request-error";

function validate (request) {
    const validation = this.validateSchema(request.body);
    if (validation.isValid) {
        return request;
    } else {
        throw new RequestError(400, "ValidationError", validation.errors);
    }
}

function authenticate (request) {
    if (!request.token) {
        return request;
    }
    const findOneParams = {
        url: this.mongodbUrl,
        collectionName: "users",
        query: {
            "services.resume.loginTokens.hashedToken": request.token
        }
    };
    return mongodb.findOne(findOneParams)
        .then(user => {
            if (!user) {
                throw new RequestError(401, "AuthenticationError", "Invalid token");
            }
            return {
                ...request,
                user
            };
        });
}

function authorize (request) {
    return bind(this, clone(request))
        .then(this.authorizeApiRequest)
        .thenReturn(request)
        .catch(error => {
            throw new RequestError(403, "AuthorizationError", error.message);
        });
}

function handle (request) {
    const {method} = request;
    switch (method) {
    case "POST":
        return insert.call(this, request.body);
    case "PUT":
        return replace.call(this, request.body);
    case "DELETE":
        return remove.call(this, request.body);
    default:
        throw new RequestError(400, "MethodError", `Unsupported method ${method}`);
    }
}

function pipeline (request) {
    return bind(this, request)
        .then(validate)
        .then(authenticate)
        .then(authorize)
        .then(handle);
}

export default function apiGatewayToKinesis (request, context) {
    return pipeline.call(this, request)
        .then(response => context.succeed(
            response
        ))
        .catch(error => context.fail(
            is(RequestError, error) ?
            error :
            new RequestError(500, "Internal server error")
        ));
}
