import Ajv from "ajv";
import {resolve} from "bluebird";
import {always} from "ramda";

export function wrapAuthorize (authorize) {
    return request => (
        resolve(request).then(authorize || always(true))
    );
}

const ajv = new Ajv();
export function checkSchema (schema, element) {
    return ajv.validate(schema, element);
}
