'use strict';

const JsonApi = use('JsonApi');

class JsonApiDestroy {
    async handle({request, response}, next) {
        await next();
        if (JsonApi.hasErrors()) {
            if
            response.send()
        }
    }
}