'use strict';

const {LogicalException} = require('@adonisjs/generic-exceptions');

class NotAcceptable extends LogicalException {
    static invoke() {
        return new this('Not Acceptable', 406, 'E_JSON_API_NOT_ACCEPTABLE');
    }
}

class UnsupportedMediaType extends LogicalException {
    static invoke() {
        return new this('Unsupported Media Type', 415, 'E_JSON_API_UNSUPPORTED_MEDIA_TYPE');
    }
}

class TypeNotDefined extends LogicalException {
    static invoke(model) {
        return new this(`jsonApiType method for ${model} is not defined`, 500, 'E_JSON_API_TYPE_NOT_DEFINED');
    }
}

class InvalidRegistry extends LogicalException {
    static invoke(message) {
        return new this(message, 500, 'E_JSON_API_INVALID_REGISTRY');
    }
}

class SerializeError extends LogicalException {
    static invoke(message) {
        return new this(message, 500, 'E_JSON_API_SERIALIZATION_ERROR');
    }
}


module.exports = {
    NotAcceptable,
    UnsupportedMediaType,
    TypeNotDefined,
    InvalidRegistry,
    SerializeError
};
