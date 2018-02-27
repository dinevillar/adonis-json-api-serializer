'use strict';

const JsonApiException = require('./JsonApiException');
const HttpStatus = require('http-status-codes');

class RegistryException extends JsonApiException {
    static invoke(message) {
        return new this(
            message, HttpStatus.INTERNAL_SERVER_ERROR, 'E_JSON_API_INVALID_REGISTRY'
        );
    }
}

module.exports = RegistryException;