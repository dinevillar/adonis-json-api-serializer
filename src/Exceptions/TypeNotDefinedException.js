'use strict';

const JsonApiException = require('JsonApiException');

class TypeNotDefinedException extends JsonApiException {
    static invoke(model) {
        return new this(`jsonApiType method for ${model} is not defined`, 500, 'E_JSON_API_TYPE_NOT_DEFINED');
    }
}

module.exports = TypeNotDefinedException;