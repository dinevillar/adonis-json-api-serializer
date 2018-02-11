'use strict';

const {JsonApiSpecificationException} = require('../Exceptions');
const {JsonApiSerializer} = use('JsonApi');

class JsonApiSpecification {
    constructor(Config) {
        this.mediaType = Config.get('jsonApi.mediaType', 'application/vnd.api+json');
    }

    async handle({request, response}, next, schemes) {
        const doContentNegotiation = !schemes.length || schemes.indexOf('cn') !== -1;
        const doResourceObject = !schemes.length || schemes.indexOf('ro') !== -1;

        if (doContentNegotiation && !request.accepts([this.mediaType])) {
            let accept = request.header('Accept');
            if (accept.indexOf(this.mediaType) !== -1) {
                throw JsonApiSpecificationException.NotAcceptable.invoke();
            }
        }

        if (request.hasBody()) {
            if (doContentNegotiation) {
                if (request.is([this.mediaType])) {
                    let type = request.header('Content-Type');
                    type = type.split(';');
                    if (type.length > 1) {
                        throw JsonApiSpecificationException.UnsupportedMediaType.invoke();
                    }
                } else {
                    throw JsonApiSpecificationException.UnsupportedMediaType.invoke();
                }
            }
            if (doResourceObject) {
                if (!request.input('data') || !request.input('data').hasOwnProperty('type')) {
                    throw JsonApiSpecificationException.UnprocessableResourceObject.invoke()
                }
                const data = request.input('data');
                try {
                    request.body = JsonApiSerializer.deserialize(data.type, {data: data});
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
