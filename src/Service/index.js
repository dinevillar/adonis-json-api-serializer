'use strict';

const _ = require('lodash');
const process = require('process');
const Serializer = require('json-api-serializer');
const {JsonApiException} = require('../Exceptions');

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

    getJsonErrorStatus() {
        if (this.jsonApiErrors.length > 1) {
            let status400 = 0;
            let status500 = 0;
            for (const jsonApiError of this.jsonApiErrors) {
                if (_.inRange(jsonApiError.status, 400, 499)) {
                    status400++;
                } else {
                    status500++;
                }
            }
            return (status400 > status500) ? 400 : 500;
        } else {
            const jsonApiError = this.jsonApiErrors.pop();
            return jsonApiError.status;
        }
    }
}

module.exports = JsonApi;
