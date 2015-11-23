export default class RequestError extends Error {

    constructor (code, message, details) {
        super();
        this.code = code;
        this.message = message;
        this.details = details;
    }

}
