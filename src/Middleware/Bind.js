'use strict';

const {JsonApiSerializer} = use('JsonApiSerializer');

class JsonApiBind {
    async handle(ctx, next, [type]) {
        ctx['jsonApi'] = {
            type: type,
            model: use(JsonApiSerializer.getRegistry(type).model),
            schema: JsonApiSerializer.getSchema(type)
        };
        await next();
    }
}
