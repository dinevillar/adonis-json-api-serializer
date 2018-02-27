'use strict';

const JsonApiSerializer = use('JsonApiSerializer');
const _ = require('lodash');

class JsonApiBind {
  async handle(ctx, next, [type]) {
    const jsonApiBind = {
      type: type,
      registry: {}
    };
    Object.assign(jsonApiBind.registry, JsonApiSerializer.getRegistry(type));
    if (_.has(jsonApiBind, 'registry.model')) {
      jsonApiBind.registry.model = use(jsonApiBind.registry.model);
    }
    if (ctx.request.all()) {
      jsonApiBind['data'] = JsonApiSerializer.deserialize(type, ctx.request.all());
    }
    ctx['jsonApi'] = jsonApiBind;
    await next();
  }
}

module.exports = JsonApiBind;
