export default class RequestError extends Error {

    constructor (code, message) {
        super();
        this.code = code;
        this.message = message;
    }

}
