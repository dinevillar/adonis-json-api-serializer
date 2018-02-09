'use strict';

const _ = require('lodash');
const process = require('process');
const Serializer = require('json-api-serializer');
const JsonApiException = require('../Exceptions/JsonApiException');

class JsonApi {
    constructor(Config) {
        const config = Config.get('jsonApi.globalOptions');
        this.JsonApiSerializer = new Serializer(config);
        this.includeStackTrace = process.env.NODE_ENV !== 'production';
        this.jsonApiErrors = [];
    }

    handleError(error) {
        let jsonApiError = error;
        if (!(error instanceof JsonApiException)) {
            jsonApiError = JsonApiException.invokeFromError(error);
        }
        if (this.includeStackTrace) {
            jsonApiError.meta = {
                stack: error.stack
            }
        }
        this.jsonApiErrors.push(jsonApiError);
    }

    hasErrors() {
        return this.jsonApiErrors.length > 0;
    }
}

module.exports = JsonApi;
