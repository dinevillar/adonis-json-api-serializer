'use strict';

const _ = require('lodash');
const JsonApiSerializer = require('json-api-serializer');
const JsonApiErrorHandler = require('./ErrorHandler');
const JsonApiRecordBrowser = require('./RecordBrowser');

class JsonApi {
    constructor(Config) {
        this.config = Config.get('jsonApi');
        this.Serializer = new JsonApiSerializer(this.config.globalOptions);
        this.ErrorHandler = new JsonApiErrorHandler(this.config);
        this.RecordBrowser = JsonApiRecordBrowser;
    }

    static get empty() {
        return {
            jsonapi: {
                version: '1.0'
            },
            data: null
        };
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
        return this.Serializer.schemas[type];
    }
}

module.exports = JsonApi;
