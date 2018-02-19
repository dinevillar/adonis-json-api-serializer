'use strict';

const {JsonApiSpecificationException} = require('../Exceptions');
const JsonApi = use('JsonApi');
const process = require('process');
const Logger = use('Logger');

class JsonApiSpecification {
  constructor(Config) {
    this.mediaType = Config.get('jsonApi.mediaType', 'application/vnd.api+json');
    this.justWarn = process.env.NODE_ENV !== 'production';
  }

  async handle({request, response}, next, schemes) {
    const doContentNegotiation = !schemes.length || schemes.indexOf('cn') !== -1;
    const doResourceObject = !schemes.length || schemes.indexOf('ro') !== -1;
    if (doContentNegotiation && !request.accepts([this.mediaType])) {
      let accept = request.header('Accept');
      if (accept.indexOf(this.mediaType) !== -1) {
        const notAcceptErr = JsonApiSpecificationException.NotAcceptable.invoke();
        if (this.justWarn) {
          Logger.warning(notAcceptErr.message);
        } else {
          throw notAcceptErr;
        }
      }
    }

    if (request.hasBody()) {
      if (doContentNegotiation) {
        const unsuppErr = JsonApiSpecificationException.UnsupportedMediaType.invoke();
        if (request.is([this.mediaType])) {
          let type = request.header('Content-Type');
          type = type.split(';');
          if (type.length > 1) {
            if (this.justWarn) {
              Logger.warning(unsuppErr.message);
            } else {
              throw unsuppErr;
            }
          }
        } else {
          if (this.justWarn) {
            Logger.warning(unsuppErr.message);
          } else {
            throw unsuppErr;
          }
        }
      }
      if (doResourceObject) {
        if (!request.input('data') || !request.input('data').hasOwnProperty('type')) {
          const uro = JsonApiSpecificationException.UnprocessableResourceObject.invoke();
          uro.links = {
            about: "http://jsonapi.org/format/#crud"
          };
          throw uro;
        }
        const data = request.input('data');
        try {
          request.body = JsonApi.JsonApiSerializer.deserialize(data.type, {data: data});
        } catch (error) {
          throw JsonApiSpecificationException.UnknownResourceObjectType.invoke(data.type, error.message);
        }
      }
    }
    await next();
    if (doContentNegotiation) {
      response.header('Content-Type', this.mediaType);
    }
  }
}

module.exports = JsonApiSpecification;
