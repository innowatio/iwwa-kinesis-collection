import {DynamoDB as AWSDynamoDB} from "aws-sdk";
import {DynamoDB as DOCDynamoDB} from "dynamodb-doc";
import {promisify} from "bluebird";

var awsClient = new AWSDynamoDB({
    apiVersion: "2012-08-10"
});

var docClient = new DOCDynamoDB(awsClient);

export var putItem = promisify(docClient.putItem, docClient);
export var deleteItem = promisify(docClient.deleteItem, docClient);
