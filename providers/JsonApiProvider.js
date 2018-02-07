'use strict';

const {ServiceProvider} = require('@adonisjs/fold');
const _ = require('lodash');
const GE = require('@adonisjs/generic-exceptions');

class JsonApiProvider extends ServiceProvider {

    _registerService() {
        this.app.singleton('JsonApi/Service', (app) => {
            const Config = app.use('Adonis/Src/Config');
            return new (require('../src/Service/JsonApiService'))(Config);
        });
    };

    _registerSerializer() {
        this.app.bind('JsonApi/Serializer/LucidSerializer', () => require('../src/Serializer/LucidSerializer'));
    }

    _registerMiddleware() {
        this.app.bind('JsonApi/Middleware/ContentNegotiation', () => require('../src/Middleware/ContentNegotiation'));
    }

    _registerExceptions() {
        this.app.bind('JsonApi/Exception/NotAcceptable', () => require('../src/Exceptions/NotAcceptable'));
        this.app.bind('JsonApi/Exception/UnsupportedMediaType', () => require('../src/Exceptions/UnsupportedMediaType'));
    }

    register() {
        this._registerService();
        this._registerSerializer();
        this._registerMiddleware();
        this._registerExceptions();
    }

    boot() {
        const Config = use('Adonis/Src/Config');
        const config = Config.get('jsonApi.registry');

        if (!config || !_.size(config) === 0) {
            throw GE.RuntimeException.missingConfig('configuration for jsonApi', 'config/jsonApi.js')
        }

        const Serializer = use('JsonApi/Service').Serializer;
        const Registry = Config.get('jsonApi.registry');
        for (let type in Registry) {
            try {
                Serializer.register(type, Registry[type]);
            } catch (error) {
                console.error(error);
            }
        }
    }
}

module.exports = JsonApiProvider;
