import consumer from "./consumer";
import producer from "./producer";

export default class Collection {

    constructor ({name, kinesisStreamName, dynamodbTableName}) {
        this.name = name;
        this.kinesisStreamName = kinesisStreamName;
        this.dynamodbTableName = dynamodbTableName;
        this.consumer = consumer.bind(this);
        this.producer = producer.bind(this);
    }

}
