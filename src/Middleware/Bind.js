'use strict';

const JsonApi = use('JsonApi');

class JsonApiBind {
    async handle(ctx, next, [type]) {
        ctx['jsonApi'] = {
            type: type,
            model: use(JsonApi.getRegistry(type).model),
            schema: JsonApi.getSchema(type)
        };
        await next();
    }
}
