'use strict';

const _ = require('lodash');
const JsonApiException = require('./Exceptions/JsonApiException');

class ErrorHandler {
    constructor(Config) {
        this.includeStackTraceInErrors = Config.get('jsonApi.includeStackTraceInErrors', true);
        this.jsonApiErrors = [];
    }

    async handleError(error, {request, response}, add = false) {
        const jsonApiError = this.parseError(error);
        this.jsonApiErrors.push(jsonApiError);
        if (!add) {
            await response.status(jsonApiError.status).send({"errors": this.jsonApiErrors});
            this.jsonApiErrors = [];
        }
    }

    parseError(error) {
        let jsonApiError = error;
        if (!(error instanceof JsonApiException)) {
            jsonApiError = JsonApiException.invokeFromError(error);
        }
        if (this.includeStackTraceInErrors) {
            jsonApiError.meta = {
                stack: error.stack.split(/\r?\n/)
            }
        }
        return jsonApiError.toJSON();
    }

    getStatus() {
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

module.exports = ErrorHandler;