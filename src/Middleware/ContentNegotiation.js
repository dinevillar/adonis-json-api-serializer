'use strict';

const CE = require('../Exceptions');

class ContentNegotiation {
    constructor(Config) {
        this.mediaType = Config.get('jsonApi.mediaType', 'application/vnd.api+json');
    }

    async handle({request, response}, next) {
        if (request.hasBody()) {
            if (request.is([this.mediaType])) {
                let type = request.header('Content-Type');
                type = type.split(';');
                if (type.length > 1) {
                    throw CE.UnsupportedMediaType.invoke();
                }
            } else {
                throw CE.UnsupportedMediaType.invoke();
            }
        }
        if (!request.accepts([this.mediaType])) {
            let accept = request.header('Accept');
            if (accept.indexOf(this.mediaType) !== -1) {
                throw CE.NotAcceptable.invoke();
            }
        }
        await next();
        response.header('Content-Type', this.mediaType);
    }
}

module.exports = ContentNegotiation;
