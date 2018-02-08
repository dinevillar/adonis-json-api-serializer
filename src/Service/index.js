'use strict';

const jsonApiSerializer = require('json-api-serializer');

class JsonApi {
    constructor(Config) {
        const config = Config.get('jsonApi.globalOptions');
        this.JsonApiSerializer = new jsonApiSerializer(config);
    }
}

module.exports = JsonApi;
