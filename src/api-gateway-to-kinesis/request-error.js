export default class RequestError extends Error {

    constructor (code, message) {
        this.code = code;
        this.message = message;
    }

}
