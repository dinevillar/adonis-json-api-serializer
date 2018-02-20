'use strict';

const JsonApiException = require('./JsonApiException');

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

class UnprocessableResourceObject extends JsonApiException {
    static invoke(message) {
        if (!message) {
            message = "Request resource object cannot be processed."
        }
        return new this(message, 422, 'E_JSON_API_UNPROCESSABLE_ENTITY');
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

class ResourceObjectDoesNotExist extends JsonApiException {
    static invoke(type, id, message) {
        if (!message) {
            message = `Resource object: ${type} - ${id} does not exist.`
        }
        return new this(message, 404, 'E_JSON_API_RESOURCE_OBJECT_DOES_NOT_EXIST');
    }
}

module.exports = {
    NotAcceptable,
    UnsupportedMediaType,
    UnprocessableResourceObject,
    UnknownResourceObjectType,
    ResourceObjectDoesNotExist
};
