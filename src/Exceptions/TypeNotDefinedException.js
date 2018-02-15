'use strict';

const JsonApiException = require('./JsonApiException');

class TypeNotDefinedException extends JsonApiException {
    static invoke(model) {
        return new this(`Cannot find registry for ${model} in config.`, 500, 'E_JSON_API_TYPE_NOT_DEFINED');
    }
}

module.exports = TypeNotDefinedException;