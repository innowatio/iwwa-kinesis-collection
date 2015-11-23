import apiGatewayToKinesis from "./api-gateway-to-kinesis";
import {getValidateSchema, noop} from "./api-gateway-to-kinesis/utils";
import kinesisToMongodb from "./kinesis-to-mongodb";

export default class Collection {

    constructor (options) {

        this.name = options.name;
        this.mongodbUrl = options.mongodbUrl;

        // Configure apiGatewayToKinesis
        this.validateSchema = getValidateSchema(options.schema);
        this.authorizeApiRequest = options.authorizeApiRequest || noop;
        this.kinesisStreamName = options.kinesisStreamName;
        this.apiGatewayToKinesis = apiGatewayToKinesis.bind(this);

        // Configure kinesisToMongodb
        this.mongodbCollectionName = options.name;
        this.kinesisToMongodb = kinesisToMongodb.bind(this);

    }

}

export {setLogger} from "./services/logger";
export {default as RequestError} from "./api-gateway-to-kinesis/request-error";
