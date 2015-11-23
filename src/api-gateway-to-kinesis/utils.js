import Ajv from "ajv";

export function noop () {
    // noop
}

export function getValidateSchema (schema) {
    const ajv = new Ajv({
        allErrors: true,
        format: "full"
    });
    const validate = ajv.compile(schema);
    return object => {
        const isValid = validate(object);
        return {
            isValid: isValid,
            errors: isValid ? null : ajv.errorsText(validate.errors)
        };
    };
}
