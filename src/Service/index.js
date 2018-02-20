'use strict';

const _ = require('lodash');
const process = require('process');
const Serializer = require('@dinevillar/json-api-serializer');
const {JsonApiException, JsonApiSpecificationException} = require('../Exceptions');
const Logger = use('Logger');

class JsonApi {
    constructor(Config) {
        this.config = Config.get('jsonApi');
        this.JsonApiSerializer = new Serializer(this.config.globalOptions);
        this.includeStackTrace = process.env.NODE_ENV !== 'production';
        this.JSE = JsonApiSpecificationException;
        this.JsonApiException = JsonApiException;
        this.jsonApiErrors = [];
    }

    setCommon(jsonApi) {
        if (this.config.commonMeta) {
            jsonApi.meta = _.merge({}, jsonApi.meta, this.config.commonMeta);
        }
        return jsonApi;
    }

    empty() {
        return this.setCommon({
            jsonapi: {
                version: '1.0'
            },
            data: null
        });
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

    getJsonError() {
        return this.setCommon(
            {
                jsonapi: {
                    version: '1.0'
                },
                errors: this.jsonApiErrors
            }
        );
    }

    async handleError(error, {request, response}) {
        const jsonApiError = this.parseError(error);
        this.pushError(error);
        await response.status(jsonApiError.status).send(this.getJsonError());
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
            return this.jsonApiErrors[0].status;
        }
    }
}

module.exports = JsonApi;
