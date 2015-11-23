import {expect} from "chai";

import RequestError from "api-gateway-to-kinesis/request-error";

describe("RequestError", () => {

    it("extends `Error`", () => {
        const error = new RequestError(400, "Message", "Details");
        expect(error).to.be.an.instanceOf(Error);
    });

    it("has properties `code`, `message` and `details`", () => {
        const error = new RequestError(400, "Message", "Details");
        expect(error).to.have.property("code", 400);
        expect(error).to.have.property("message", "Message");
        expect(error).to.have.property("details", "Details");
    });

});
