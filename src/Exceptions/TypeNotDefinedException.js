'use strict';

const JsonApiException = require('./JsonApiException');
const HttpStatus = require('http-status-codes');

class TypeNotDefinedException extends JsonApiException {
    static invoke(model) {
        return new this(`Cannot find registry for ${model} in config.`, HttpStatus.INTERNAL_SERVER_ERROR, 'E_JSON_API_TYPE_NOT_DEFINED');
    }
}

module.exports = TypeNotDefinedException;