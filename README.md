[![Build Status](https://travis-ci.org/innowatio/lkd-collection.svg?branch=master)](https://travis-ci.org/innowatio/lkd-collection)
[![Coverage Status](https://coveralls.io/repos/innowatio/lkd-collection/badge.svg?branch=master&service=github)](https://coveralls.io/github/innowatio/lkd-collection?branch=master)
[![Dependency Status](https://david-dm.org/innowatio/lkd-collection.svg)](https://david-dm.org/innowatio/lkd-collection)
[![devDependency Status](https://david-dm.org/innowatio/lkd-collection/dev-status.svg)](https://david-dm.org/innowatio/lkd-collection#info=devDependencies)

#lkd-collection

Implement collections in a lkd stack (Lambda, Kinesis, DynamoDB).

## How it works

The library implements two lambda functions: a producer and a consumer.

The producer is invoked by API Gateway, and its job is to publish
collection-related events into a Kinesis Stream. The consumer is invoked by
Kinesis, and its job is to build a materialized view of the collection into
DynamoDB, taking as source the collection-related events created by the
producer.

![Flow](./docs/flow.png)

## Application event format

```json
    {
        "data": {},
        "timestamp": 1437918813731,
        "type": "event-type"
    }
```

The `data` property can be any JSON document.

## Collection events

### Insert

**API Gateway request body**:

```json
    {
        "method": "/collection-name/insert",
        "params": [{
            "elementKey": "elementValue"
        }]
    }
```

**Resulting event sent to kinesis**:

```json
    {
        "data": {
            "element": {
                "elementKey": "elementValue"
            }
        },
        "timestamp": 1437918813731,
        "type": "/collection-name/insert"
    }
```

**Resulting document inserted into dynamodb**

```json
{
    "id": "someId",
    "elementKey": "elementValue"
}
```

### Remove

**API Gateway request body**:

```json
    {
        "method": "/collection-name/remove",
        "params": ["elementId"]
    }
```

**Resulting event sent to kinesis**:

```json
    {
        "data": {
            "id": "elementId"
        },
        "timestamp": 1437918813731,
        "type": "/collection-name/remove"
    }
```

**Resuling operation on dynamodb**

Removal of document with `document.id === elementId`.

### Replace

**API Gateway request body**:

```json
    {
        "method": "/collection-name/replace",
        "params": ["elementId", {
            "replacedKey": "replacedValue"
        }]
    }
```

**Resulting event sent to kinesis**:

```json
    {
        "data": {
            "id": "elementId",
            "element": {
                "replacedKey": "replacedValue"
            }
        },
        "timestamp": 1437918813731,
        "type": "/collection-name/replace"
    }
```

**Resulting document inserted into dynamodb (replaces the existing one)**

```json
{
    "id": "someId",
    "replacedKey": "replacedValue"
}
```

## Example usage

```js
/* Lambda function invoked by API Gateway */
import Collection from "lkd-collection";

var myCollection = new Collection({
    name: "myCollectionName"
    kinesisStreamName: "myStream"
});

export var handler = myCollection.producer;
```

```js
/* Lambda function invoked by Kinesis */
import Collection from "lkd-collection";

var myCollection = new Collection({
    name: "myCollectionName",
    dynamodbTableName: "myTable"
});

export var handler = myCollection.consumer;
```
