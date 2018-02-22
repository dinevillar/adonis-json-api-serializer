'use strict';

const {ServiceProvider} = require('@adonisjs/fold');
const _ = require('lodash');
const GE = require('@adonisjs/generic-exceptions');
const RegistryException = require('../src/Exceptions/RegistryException');

class JsonApiProvider extends ServiceProvider {

    _registerService() {
        this.app.singleton('JsonApi/Src/Serializer', (app) => {
            return new (require('../src'))(app.use('Adonis/Src/Config'));
        });
        this.app.alias('JsonApi/Src/Serializer', 'JsonApi');
    };

    _registerSerializer() {
        this.app.bind('JsonApi/Src/Lucid/Serializer', () => require('../src/Lucid/Serializer'));
        this.app.alias('JsonApi/Service', 'JsonApi');
    }

    _registerMiddleware() {
        this.app.bind('JsonApi/Middleware/Specification', (app) => {
            const JsonApiSpecification = require('../src/Middleware/Specification');
            return new JsonApiSpecification(app.use('Adonis/Src/Config'));
        });

        this.app.bind('JsonApi/Middleware/Bind', (app) => {
            const JsonApiBind = require('../src/Middleware/JsonApiBind');
            return new JsonApiBind();
        });
    }

    register() {
        this._registerService();
        this._registerSerializer();
        this._registerMiddleware();
    }

    boot() {
        const Config = use('Adonis/Src/Config');
        const RouteManager = use('Adonis/Src/Route');
        const Server = use('Adonis/Src/Server');
        const config = Config.get('jsonApi');

        if (!config || !_.size(config) === 0) {
            throw GE.RuntimeException.missingConfig('configuration for jsonApi', 'config/jsonApi.js')
        }

        const {JsonApiSerializer} = use('JsonApi');
        const Registry = Config.get('jsonApi.registry');
        for (const type in Registry) {
            try {
                JsonApiSerializer.register(type, Registry[type].structure);
            } catch (error) {
                throw RegistryException.invoke(type + ": " + error.message);
            }
        }

        Server.registerNamed({jsonApiBind: 'JsonApi/Middleware/Bind'});

        RouteManager.Route.macro('jsonApi', (jsonType) => {
            this.middleware([`jsonApiBind:${jsonType}`, 'jsonApiSpec']);
            return this;
        });
    }
}

module.exports = JsonApiProvider;
