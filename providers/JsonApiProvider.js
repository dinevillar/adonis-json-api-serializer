'use strict';

const {ServiceProvider} = require('@adonisjs/fold');
const _ = require('lodash');
const GE = require('@adonisjs/generic-exceptions');
const CE = require('../src/Exceptions');

class JsonApiProvider extends ServiceProvider {

    _registerService() {
        this.app.singleton('JsonApi', (app) => {
            return new (require('../src/Service'))(app.use('Adonis/Src/Config'));
        });
    };

    _registerSerializer() {
        this.app.bind('JsonApi/Serializer/LucidSerializer', () => require('../src/Serializer/LucidSerializer'));
    }

    _registerMiddleware() {
        this.app.bind('JsonApi/Middleware/Specification', (app) => {
            const ContentNegotiation = require('../src/Middleware');
            return new ContentNegotiation(app.use('Adonis/Src/Config'));
        });
    }

    register() {
        this._registerService();
        this._registerSerializer();
        this._registerMiddleware();
    }

    boot() {
        const Config = use('Adonis/Src/Config');
        const config = Config.get('jsonApi.registry');

        if (!config || !_.size(config) === 0) {
            throw GE.RuntimeException.missingConfig('configuration for jsonApi', 'config/jsonApi.js')
        }

        const {JsonApiSerializer} = use('JsonApi');
        const Registry = Config.get('jsonApi.registry');
        for (let type in Registry) {
            try {
                JsonApiSerializer.register(type, Registry[type]);
            } catch (error) {
                throw CE.InvalidRegistry.invoke(type + ": " + error.message);
            }
        }
    }
}

module.exports = JsonApiProvider;
