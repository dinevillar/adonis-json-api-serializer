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

class MalformedResourceObject extends LogicalException {
    static invoke(message) {
        if (!message) {
            message = "Request MUST include a single resource object as primary data. The resource object MUST contain at least a 'type' member."
        }
        return new this(message, 400, 'E_JSON_API_MALFORMED_REQUEST');
    }
}

class UnknownResourceObjectType extends LogicalException {
    static invoke(type, message) {
        if (!message) {
            message = `Unknown resource object type: ${type}`
        }
        return new this(message, 409, 'E_JSON_API_UNKNOWN_RESOURCE_OBJECT_TYPE');
    }
}


module.exports = {
    NotAcceptable,
    UnsupportedMediaType,
    TypeNotDefined,
    InvalidRegistry,
    MalformedResourceObject,
    UnknownResourceObjectType
};
