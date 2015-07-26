[![Build Status](https://travis-ci.org/innowatio/iwwa-kinesis-collection.svg?branch=master)](https://travis-ci.org/innowatio/iwwa-kinesis-collection)
[![Dependency Status](https://david-dm.org/innowatio/iwwa-kinesis-collection.svg)](https://david-dm.org/innowatio/iwwa-kinesis-collection)
[![devDependency Status](https://david-dm.org/innowatio/iwwa-kinesis-collection/dev-status.svg)](https://david-dm.org/innowatio/iwwa-kinesis-collection#info=devDependencies)

# iwwa-kinesis-collection

This library is intended to be used within a AWS lambda function. Its purpose is
to receive "collection events" from http requests routed through by AWS API
Gateway, to convert those events into the application event format and pipe them
to kinesis.

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

### Update

**API Gateway request body**:

```json
    {
        "method": "/collection-name/update",
        "params": ["elementId", [{
            "op": "add",
            "path": "/elementKey",
            "value": "elementValue"
        }]]
    }
```

**Resulting event sent to kinesis**:

```json
    {
        "data": {
            "id": "elementId",
            "patches": [{
                "op": "add",
                "path": "/elementKey",
                "value": "elementValue"
            }]
        },
        "timestamp": 1437918813731,
        "type": "/collection-name/update"
    }
```

Patches is a list of [JSON patches](http://tools.ietf.org/html/rfc6902).
A useful library to deal with JSON patches is
[Starcounter-Jack/JSON-Patch](https://github.com/Starcounter-Jack/JSON-Patch)
(also used by this library).

## Example usage

```js
// Labmda function

import Collection from "iwwa-kinesis-collection";

var myCollection = new Collection("myCollectionName");

export function handler (event, context) {
    myCollection.processEvent(event)
        .then(contect.succeed)
        .catch(context.fail);
}

```
