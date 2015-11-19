import {bind} from "bluebird";
import {clone} from "ramda";

import * as mongodb from "../services/mongodb";
import {insert, replace, remove} from "./handlers";
import RequestError from "./request-error";
import {checkSchema} from "./utils";

function validate (request) {
    if (request.body && checkSchema(this.schema, request.body)) {
        return request;
    } else {
        throw new RequestError(400, "ValidationError");
    }
}

function authorize (request) {
    return this.authorizeApiRequest(clone(request))
        .then(authorized => {
            if (authorized) {
                return request;
            } else {
                throw new RequestError(403, "AuthorizationError");
            }
        });
}

function authenticate (request) {
    const findOneParams = {
        url: this.mongodbUrl,
        collectionName: "users",
        query: {
            "services.resume.loginTokens.hashedToken": request.token
        }
    };
    return mongodb.findOne(findOneParams)
        .then(user => ({...request, user}));
}

function handle (request) {
    switch (request.method) {
    case "POST":
        return insert.call(this, request.body);
    case "PUT":
        return replace.call(this, request.body);
    case "DELETE":
        return remove.call(this, request.body);
    default:
        throw new RequestError(400, "MethodError");
    }
}

function pipeline (request) {
    return bind(this, request)
        .then(validate)
        .then(authenticate)
        .then(authorize)
        .then(handle);
}

export default function handler (request, context) {
    pipeline(request)
        .then(response => context.succeed(response))
        .catch(error => context.fail(error));
}
