# kth-node-api-key-strategy
[![Build Status](https://travis-ci.org/KTH/kth-node-api-key-strategy.svg?branch=master)](https://travis-ci.org/KTH/kth-node-api-key-strategy)
A api key strategy for Node applications.

## Configure 

#### localSettings.js
```
module.exports = {
  secure: {
    api_keys: [
      {name: 'devClient', apikey: '1234', scope: ['write', 'read']},
      {name: 'testClient', apikey: '123456', scope: ['read']}
    ],
  }
};
```
#### swagger.js

**Setting security on a route**
```
"/v1/some/route/{id}": {
      "get": {
        "operationId": "",
        "summary": "",
        "description": "",
        "parameters": [],
        "tags": [
          "v1"
        ],
        "responses": { ... },
        "security": {
          "api_key": [
            "read"
          ]
        }
      }
    }
```
**Defining security definition**
```
"securityDefinitions": {
    "api_key": {
      "type": "apiKey",
      "name": "api_key",
      "in": "header",
      "scopes": {
        "read": "Read access to data",
        "write": "Write access to data"
      }
    }
  }
```
