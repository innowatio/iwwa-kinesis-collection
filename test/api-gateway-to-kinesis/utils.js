import {expect} from "chai";

import {getValidateSchema} from "api-gateway-to-kinesis/utils";

describe("getValidateSchema", () => {

    const schema = {
        $schema: "http://json-schema.org/draft-04/schema#",
        type: "object"
    };

    it("returns a function", () => {
        const ret = getValidateSchema(schema);
        expect(ret).to.be.a("function");
    });

    describe("the function returned", () => {
        it("returns an object with an `isValid` property", () => {
            const ret = getValidateSchema(schema)({});
            expect(ret).to.have.property("isValid");
        });
        it("returns an object with an `errors` property", () => {
            const ret = getValidateSchema(schema)({});
            expect(ret).to.have.property("errors");
        });
        it("correctly validates the object", () => {
            const valid = {};
            const invalid = "";
            const validateSchema = getValidateSchema(schema);
            const validRet_0 = validateSchema(valid);
            expect(validRet_0.isValid).to.equal(true);
            expect(validRet_0.errors).to.equal(null);
            const invalidRet_0 = validateSchema(invalid);
            expect(invalidRet_0.isValid).to.equal(false);
            expect(invalidRet_0.errors).to.be.a("string");
            const validRet_1 = validateSchema(valid);
            expect(validRet_1.isValid).to.equal(true);
            expect(validRet_1.errors).to.equal(null);
            const invalidRet_1 = validateSchema(invalid);
            expect(invalidRet_1.isValid).to.equal(false);
            expect(invalidRet_1.errors).to.be.a("string");
        });
    });

});
