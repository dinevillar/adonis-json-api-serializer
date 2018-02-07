'use strict';

const JSONAPISerializer = require('json-api-serializer');

class JSONApiService {
    constructor(Config) {
        const config = Config.get('jsonApi.globalOptions');
        this.Serializer = new JSONAPISerializer(config);
    }
}

module.exports = JSONApiService;
