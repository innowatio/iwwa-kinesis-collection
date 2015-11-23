import bunyan from "bunyan";

const container = {
    logger: bunyan.createLogger({name: "lk-collection"})
};

export function getLogger () {
    return container.logger;
}

export function setLogger (logger) {
    container.logger = logger;
}
