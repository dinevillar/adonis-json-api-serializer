'use strict';

const Config = use('Adonis/Src/Config');
const UnsupportedMediaType = use('JsonApi/Exception/UnsupportedMediaType');
const NotAcceptable = use('JsonApi/Exception/NotAcceptable');

class ContentNegotiation {
    async handle({request, response}, next) {
        const mediaType = Config.get('jsonApi.mediaType', 'application/vnd.api+json');
        if (request.hasBody()) {
            if (request.is([mediaType])) {
                let type = request.header('Content-Type');
                type = type.split(';');
                if (type.length > 1) {
                    throw new UnsupportedMediaType();
                }
            } else {
                throw new UnsupportedMediaType();
            }
        }
        if (!request.accepts([mediaType])) {
            let accept = request.header('Accept');
            if (accept.indexOf(mediaType) !== -1) {
                throw new NotAcceptable();
            }
        }
        await next();
        response.header('Content-Type', mediaType);
    }
}

module.exports = ContentNegotiation;
