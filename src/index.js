import jsonRpcToKinesis from "./json-rpc-to-kinesis";
import kinesisToDynamodb from "./kinesis-to-dynamodb";
import kinesisToMongodb from "./kinesis-to-mongodb";

export default class Collection {

    constructor (options) {

        this.name = options.name;

        // Configure jsonRpcToKinesis
        this.kinesisStreamName = options.kinesisStreamName;
        this.jsonRpcToKinesis = jsonRpcToKinesis.bind(this);

        // Configure kinesisToDynamodb
        this.dynamodbTableName = options.dynamodbTableName;
        this.kinesisToDynamodb = kinesisToDynamodb.bind(this);

        // Configure kinesisToMongodb
        this.mongodbUrl = options.mongodbUrl;
        this.mongodbCollectionName = options.mongodbCollectionName;
        this.kinesisToMongodb = kinesisToMongodb.bind(this);

    }

}
