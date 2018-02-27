'use strict';

const _ = require('lodash');
const JsonApiSerializerLib = require('@dinevillar/json-api-serializer');

class Serializer {
  constructor(Config) {
    this.config = Config.get('jsonApi');
    this.topLevelMeta = Config.get('jsonApi.globalOptions.topLevelMeta', {});
    this.library = new JsonApiSerializerLib(Config.get('jsonApi.globalOptions', {}));
  }

  static get empty() {
    const empty = {
      jsonapi: {
        version: '1.0'
      },
      data: null
    };
    empty['meta'] = Object.assign(
      {}, empty.meta,
      this.topLevelMeta
    );
    return empty;
  }

  register(type, schema, options) {
    this.library.register(type, schema, options);
  }

  serialize(type, data, schema, extraData) {
    return this.library.serialize(type, data, schema, extraData);
  }

  deserialize(type, data, schema) {
    return this.library.deserialize(type, data, schema);
  }

  getRegistry(type) {
    if (!type) {
      return this.config.registry;
    } else {
      return this.config.registry[type];
    }
  }

  getTypeOfModel(name) {
    return _.findKey(this.getRegistry(), (o) => {
      return _.endsWith(o.model, name);
    });
  }

  getSchema(type) {
    return this.library.schemas[type];
  }
}

module.exports = Serializer;
