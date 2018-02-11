'use strict';
const JsonApiException = require('./JsonApiException');

class RegistryException extends JsonApiException {
    static invoke(message) {
        return new this(
            message, 500, 'E_JSON_API_INVALID_REGISTRY'
        );
    }
}

module.exports = RegistryException;