'use strict';

const JsonApiException = require('JsonApiException');

class NotAcceptable extends JsonApiException {
    static invoke(acceptHeader) {
        const error = new this(
            'Violation of JSON API v1 content negotiation rules.', 406, 'E_JSON_API_NOT_ACCEPTABLE'
        );
        error.links = {
            about: "http://jsonapi.org/format/#content-negotiation-servers"
        };
        error.detail = "Accept header contains the JSON API media type and all instances of that media type are modified with media type parameters.";
        if (acceptHeader) {
            error.source = {
                header: acceptHeader
            };
        }
        return error;
    }
}

class UnsupportedMediaType extends JsonApiException {
    static invoke(contentTypeHeader) {
        const error = new this(
            'Violation of JSON API v1 content negotiation rules.', 415, 'E_JSON_API_UNSUPPORTED_MEDIA_TYPE'
        );
        error.links = {
            about: "http://jsonapi.org/format/#content-negotiation-servers"
        };
        error.detail = "Content-Type header contains media type parameters.";
        if (contentTypeHeader) {
            error.source = {
                header: contentTypeHeader
            };
        }
        return error;
    }
}

// class TypeNotDefined extends JsonApiException {
//     static invoke(model) {
//         return new this(`jsonApiType method for ${model} is not defined`, 500, 'E_JSON_API_TYPE_NOT_DEFINED');
//     }
// }
//
// class InvalidRegistry extends JsonApiException {
//     static invoke(message) {
//         return new this(message, 500, 'E_JSON_API_INVALID_REGISTRY');
//     }
// }

class MalformedResourceObject extends JsonApiException {
    static invoke(message) {
        if (!message) {
            message = "Request MUST include a single resource object as primary data. The resource object MUST contain at least a 'type' member."
        }
        return new this(message, 400, 'E_JSON_API_MALFORMED_REQUEST');
    }
}

class UnknownResourceObjectType extends JsonApiException {
    static invoke(type, message) {
        if (!message) {
            message = `Unknown resource object type: ${type}`
        }
        return new this(message, 409, 'E_JSON_API_UNKNOWN_RESOURCE_OBJECT_TYPE');
    }
}


module.exports = {
    JsonApiException,
    NotAcceptable,
    UnsupportedMediaType,
    TypeNotDefined,
    InvalidRegistry,
    MalformedResourceObject,
    UnknownResourceObjectType
};
