'use strict'

const {ServiceProvider} = require('@adonisjs/fold')
const _ = require('lodash')
const GE = require('@adonisjs/generic-exceptions')
const RegistryException = require('../src/Exceptions/RegistryException')

class JsonApiProvider extends ServiceProvider {
  _registerService () {
    this.app.singleton('JsonApi/Src/Serializer', (app) => {
      return new (require('../src/Serializer'))(app.use('Adonis/Src/Config'))
    })

    this.app.singleton('JsonApi/Src/ErrorHandler', (app) => {
      const ErrorHandler = require('../src/ErrorHandler')
      return new ErrorHandler(app.use('Adonis/Src/Config'))
    })

    this.app.singleton('JsonApi/Src/RecordBrowser', () => require('../src/RecordBrowser'))

    this.app.singleton('JsonApi/Src/RelationshipHandler', () => require('../src/RelationshipHandler'))

    this.app.alias('JsonApi/Src/Serializer', 'JsonApiSerializer')
    this.app.alias('JsonApi/Src/ErrorHandler', 'JsonApiErrorHandler')
    this.app.alias('JsonApi/Src/RecordBrowser', 'JsonApiRecordBrowser')
    this.app.alias('JsonApi/Src/RelationshipHandler', 'JsonApiRelationshipHandler')
  };

  _registerSerializer () {
    this.app.bind('JsonApi/Src/Lucid/Serializer', () => require('../src/Lucid/Serializer'))
  }

  _registerMiddleware () {
    this.app.bind('JsonApi/Src/Middleware/Specification', (app) => {
      const JsonApiSpecification = require('../src/Middleware/Specification')
      return new JsonApiSpecification(app.use('Adonis/Src/Config'))
    })

    this.app.bind('JsonApi/Src/Middleware/Bind', (app) => {
      const JsonApiBind = require('../src/Middleware/Bind')
      return new JsonApiBind()
    })
  }

  _registerController () {
    this.app.bind('JsonApi/Src/Http/Controller/ResourceController', () => require('../src/Http/Controller/ResourceController'))
    this.app.alias('JsonApi/Src/Http/Controller/ResourceController', 'JsonApiResourceController')
  }

  _registerValidator () {
    this.app.bind('JsonApi/Src/Http/Validator/ResourceValidator', () => require('../src/Http/Validator/ResourceValidator'))
    this.app.alias('JsonApi/Src/Http/Validator/ResourceValidator', 'JsonApiResourceValidator')
  }

  register () {
    this._registerService()
    this._registerSerializer()
    this._registerMiddleware()
    this._registerController()
    this._registerValidator()
  }

  boot () {
    const Config = this.app.use('Adonis/Src/Config')
    const config = Config.get('jsonApi')

    if (!config || !_.size(config) === 0) {
      throw GE.RuntimeException.missingConfig('configuration for jsonApi', 'config/jsonApi.js')
    }

    const JsonApiSerializer = use('JsonApiSerializer')
    const Registry = Config.get('jsonApi.registry')
    for (const type in Registry) {
      try {
        JsonApiSerializer.register(type, Registry[type].structure)
      } catch (error) {
        throw RegistryException.invoke(type + ': ' + error.message)
      }
    }

    const RouteManager = this.app.use('Adonis/Src/Route')
    const Server = this.app.use('Adonis/Src/Server')

    Server.registerNamed({jsonApiBind: 'JsonApi/Src/Middleware/Bind'})
    Server.registerNamed({jsonApiSpec: 'JsonApi/Src/Middleware/Specification'})

    RouteManager.Route.macro('jsonApi', (jsonType) => {
      this.middleware([`jsonApiBind:${jsonType}`, 'jsonApiSpec'])
      return this
    })

    RouteManager.RouteResource.macro('jsonApi', (jsonsMap) => {
      const middlewareMap = new Map()

      for (const [routeNames, jsons] of jsonsMap) {
        const middleware = _.castArray(jsons).map((jsonType) => [`jsonApiBind:${jsonType}`, 'jsonApiSpec'])
        middlewareMap.set(routeNames, middleware)
      }
      RouteManager.RouteResource.middleware(middlewareMap)
      return this
    })
  }
}

module.exports = JsonApiProvider
