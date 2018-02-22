'use strict';

const JASE = require('../specification-exceptions');
const JsonApi = use('JsonApi');
const Logger = use('Logger');
const url = require('url');

class Specification {
    constructor(Config) {
        this.mediaType = Config.get('jsonApi.mediaType', 'application/vnd.api+json');
        this.justWarn = Config.get('jsonApi.justWarnCNViolations', true);
    }

    async handle({request, response}, next, schemes) {
        const doContentNegotiation = !schemes.length || schemes.indexOf('cn') !== -1;
        const doResourceObject = !schemes.length || schemes.indexOf('ro') !== -1;
        if (doContentNegotiation && !request.accepts([this.mediaType])) {
            let accept = request.header('Accept');
            if (accept.indexOf(this.mediaType) !== -1) {
                const na = JASE.NotAcceptable.invoke();
                if (this.justWarn) {
                    Logger.warning(na.message);
                } else {
                    throw na;
                }
            }
        }

        if (request.hasBody()) {
            if (doContentNegotiation) {
                const umt = JASE.UnsupportedMediaType.invoke();
                if (request.is([this.mediaType])) {
                    let type = request.header('Content-Type');
                    type = type.split(';');
                    if (type.length > 1) {
                        if (this.justWarn) {
                            Logger.warning(umt.message);
                        } else {
                            throw umt;
                        }
                    }
                } else {
                    if (this.justWarn) {
                        Logger.warning(umt.message);
                    } else {
                        throw umt;
                    }
                }
            }
            if (doResourceObject) {
                if (!request.input('data') || !request.input('data').hasOwnProperty('type')) {
                    const uro = JASE.UnprocessableResourceObject.invoke();
                    uro.links = {
                        about: "http://jsonapi.org/format/#crud"
                    };
                    throw uro;
                }
                const data = request.input('data');
                if (!JsonApi.getSchema(data.type)) {
                    throw JASE.UnknownResourceObjectType.invoke(data.type, error.message);
                }
            }
        }
        await next();
        if (doContentNegotiation) {
            if (response.lazyBody.content) {
                response.header('Content-Type', this.mediaType);
            }
        }
        if (doResourceObject) {
            const content = response.lazyBody.content;
            if (content && content.hasOwnProperty('links') && content.links.hasOwnProperty('self')) {
                const parsedUrl = url.parse(content.links.self);
                if (parsedUrl.host) {
                    content.links.self =
                        (parsedUrl.protocol ? parsedUrl.protocol : 'http') +
                        (parsedUrl.slashes ? "//" : "") +
                        parsedUrl.host +
                        request.originalUrl();
                } else {
                    content.links.self = request.originalUrl();
                }
            }
        }
    }
}

module.exports = Specification;
