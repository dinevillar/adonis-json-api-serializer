'use strict';

const _ = require('lodash');
const process = require('process');
const Serializer = require('json-api-serializer');
const {JsonApiException} = require('../Exceptions');
const Logger = use('Logger');

class JsonApi {
    constructor(Config) {
        this.config = Config.get('jsonApi');
        this.JsonApiSerializer = new Serializer(this.config.globalOptions);
        this.includeStackTrace = process.env.NODE_ENV !== 'production';
        this.jsonApiErrors = [];
    }

    getRegistry() {
        return this.config.registry;
    }

    getTypeOfModel(name) {
        return _.findKey(this.getRegistry(), (o) => {
            return _.endsWith(o.model, name);
        });
    }

    parseError(error) {
        let jsonApiError = error;
        if (!(error instanceof JsonApiException)) {
            jsonApiError = JsonApiException.invokeFromError(error);
        }
        if (this.includeStackTrace) {
            jsonApiError.meta = {
                stack: error.stack.split(/\r?\n/)
            }
        }
        return jsonApiError.toJSON();
    }

    async handleError(error, {request, response}) {
        const jsonApiError = this.parseError(error);
        this.pushError(error);
        await response.status(jsonApiError.status).send({"errors": this.jsonApiErrors});
        this.jsonApiErrors = [];
    }

    pushError(jsonApiError) {
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
