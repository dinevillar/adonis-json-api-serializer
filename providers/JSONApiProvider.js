'use strict';

const {ServiceProvider} = require('@adonisjs/fold');
const _ = require('lodash');
const GE = require('@adonisjs/generic-exceptions');

class JSONApiServiceProvider extends ServiceProvider {

    _registerService() {
        this.app.singleton('dinevillar/JSONApiService', (app) => {
            const Config = app.use('Aqdonis/Src/Config');
            return new (require('../src/Service'))(Config);
        });
    };

    _registerSerializer() {
        this.app.bind('dinevillar/JSONApiSerializer', () => require('../src/Serializer'));
    }

    register() {
        this._registerService();
        this._registerSerializer();
    }

    boot() {
        const Config = use('Adonis/Src/Config');
        const config = Config.get('jsonApi.registry');

        if (!config || !_.size(config) === 0) {
            throw GE.RuntimeException.missingConfig('configuration for jsonApi', 'config/jsonApi.js')
        }

        const jsonApiSerializer = use('dinevillar/JSONApiService').Serializer;
        const jsonApiRegistry = Config.get('jsonApi.registry');
        for (let type in jsonApiRegistry) {
            jsonApiSerializer.register(type, jsonApiRegistry[type]);
        }
    }
}

module.exports = JSONApiServiceProvider;
