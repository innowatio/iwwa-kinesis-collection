export function getErrorFromFunction (troublemaker) {
    try {
        troublemaker();
    } catch (e) {
        return e;
    }
}

export function getErrorFromPromise (promise) {
    return promise.catch(e => e);
}
