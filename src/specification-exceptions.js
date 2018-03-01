'use strict'

const JsonApiException = require('./Exceptions/JsonApiException')
const HttpStatus = require('http-status-codes')

class NotAcceptable extends JsonApiException {
  static invoke (acceptHeader) {
    const error = new this(
            'Violation of JSON API v1 content negotiation rules.', HttpStatus.NOT_ACCEPTABLE, 'E_JSON_API_NOT_ACCEPTABLE'
        )
    error.links = {
      about: 'http://jsonapi.org/format/#content-negotiation-servers'
    }
    error.detail = 'Accept header contains the JSON API media type and all instances of that media type are modified with media type parameters.'
    if (acceptHeader) {
      error.source = {
        header: acceptHeader
      }
    }
    return error
  }
}

class UnsupportedMediaType extends JsonApiException {
  static invoke (contentTypeHeader) {
    const error = new this(
            'Violation of JSON API v1 content negotiation rules.', HttpStatus.UNSUPPORTED_MEDIA_TYPE, 'E_JSON_API_UNSUPPORTED_MEDIA_TYPE'
        )
    error.links = {
      about: 'http://jsonapi.org/format/#content-negotiation-servers'
    }
    error.detail = 'Content-Type header contains media type parameters.'
    if (contentTypeHeader) {
      error.source = {
        header: contentTypeHeader
      }
    }
    return error
  }
}

class UnprocessableResourceObject extends JsonApiException {
  static invoke (message) {
    if (!message) {
      message = 'Request resource object cannot be processed.'
    }
    return new this(message, HttpStatus.UNPROCESSABLE_ENTITY, 'E_JSON_API_UNPROCESSABLE_ENTITY')
  }
}

class UnknownResourceObjectType extends JsonApiException {
  static invoke (type, message) {
    if (!message) {
      message = `Unknown resource object type: ${type}`
    }
    const err = new this(message, HttpStatus.CONFLICT, 'E_JSON_API_UNKNOWN_RESOURCE_OBJECT_TYPE')
    err.source = {
      pointer: type
    }
    err.meta = Object.assign({}, err.meta, {
      type, type
    })
    return err
  }
}

class ResourceObjectDoesNotExist extends JsonApiException {
  static invoke (type, id, message) {
    if (!message) {
      message = `Resource object: ${type} - ${id} does not exist.`
    }
    const err = new this(message, HttpStatus.NOT_FOUND, 'E_JSON_API_RESOURCE_OBJECT_DOES_NOT_EXIST')
    err.source = {
      pointer: id
    }
    err.meta = Object.assign({}, err.meta, {
      id: id,
      type,
      type
    })
    return err
  }
}

class RelationshipDoesNotExist extends JsonApiException {
  static invoke (type, relation, message) {
    if (!message) {
      message = `Relation of ${type} to ${relation} does not exist.`
    }
    const err = new this(message, HttpStatus.NOT_FOUND, 'E_JSON_API_RELATIONSHIP_DOES_NOT_EXIST')
    err.source = {
      pointer: relation
    }
    err.meta = Object.assign({}, err.meta, {
      relation: relation,
      type: type
    })
    return err
  }
}

class BulkRelationshipUpdateIsNotAllowed extends JsonApiException {
  static invoke (type, relation, message) {
    if (!message) {
      message = `Bulk updating of ${relationship} in ${type} is not allowed.`
    }
    const err = new this(message, HttpStatus.FORBIDDEN, 'E_JSON_API_BULK_UPDATE_NOT_ALLOWED')
    err.source = {
      pointer: relation
    }
  }
}

module.exports = {
  NotAcceptable,
  UnsupportedMediaType,
  UnprocessableResourceObject,
  UnknownResourceObjectType,
  ResourceObjectDoesNotExist,
  RelationshipDoesNotExist,
  BulkRelationshipUpdateIsNotAllowed
}
