'use strict';

const JsonApi = use('JsonApi');

class JsonApiDestroy {
    async handle({request, response}, next) {
        await next();
        if (JsonApi.hasErrors()) {
            response.status(JsonApi.getJsonErrorStatus()).send({
                errors: JsonApi.jsonApiErrors
            });
        }
    }
}