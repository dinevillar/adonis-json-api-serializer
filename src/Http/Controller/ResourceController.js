'use strict'

const _ = require('lodash')
const HttpStatus = require('http-status-codes')
const JSE = require('../../specification-exceptions')

const JsonApiRecordBrowser = use('JsonApiRecordBrowser')
const JsonApiSerializer = use('JsonApiSerializer')
const JsonApiRelationshipHandler = use('JsonApiRelationshipHandler')

class ResourceController {

  async index ({request, response, jsonApi}) {
    const modelInstances = await JsonApiRecordBrowser.init(jsonApi)
      .request(request.get())
      .paginateOrFetch()
    response.status(HttpStatus.OK)
      .send(modelInstances.toJSON())
  }

  async show ({params, request, response, jsonApi}) {
    const idFilter = {[_.get(jsonApi, 'registry.structure.id', 'id')]: params.id}
    const modelInstance = await JsonApiRecordBrowser.init(jsonApi)
      .request(request.get())
      .filter(idFilter)
      .first()
    if (modelInstance) {
      response.status(HttpStatus.OK)
        .send(modelInstance.toJSON())
    } else {
      throw JSE.ResourceObjectDoesNotExist.invoke(
        jsonApi.type,
        params.id
      )
    }
  }

  async store ({request, response, jsonApi}) {
    const Model = jsonApi.registry.model
    let data = _.clone(jsonApi.data)
    if (typeof Model.writeable === 'object') {
      data = _.pick(data, Model.writeable)
    }
    const modelInstance = await Model.create(data)
    const relationships = _.get(request.all(), 'data.relationships', false)
    if (relationships) {
      const relationshipsHandler = JsonApiRelationshipHandler.init(jsonApi, modelInstance)
      await relationshipsHandler.handleRelationshipUpdate(relationships)
    }
    response.status(HttpStatus.CREATED).send(modelInstance.toJSON())
  }

  async update ({params, request, response, jsonApi}) {
    const Model = jsonApi.registry.model
    const idField = _.get(jsonApi, 'registry.structure.id', 'id')
    const modelInstance = await Model.findBy(idField, params.id)
    if (modelInstance) {
      let data = _.clone(jsonApi.data)
      if (typeof Model.writeable === 'object') {
        data = _.pick(data, Model.writeable)
      }
      modelInstance.merge(data)
      await modelInstance.save()
      const relationships = _.get(request.all(), 'data.relationships', false)
      if (relationships) {
        const relationshipsHandler = JsonApiRelationshipHandler.init(jsonApi, modelInstance)
        await relationshipsHandler.handleRelationshipUpdate(relationships)
      }
      response
        .status(HttpStatus.OK)
        .send(modelInstance.toJSON())
    } else {
      throw JSE.ResourceObjectDoesNotExist.invoke(
        jsonApi.type,
        params.id
      )
    }
  }

  async destroy ({params, response, jsonApi}) {
    const Model = jsonApi.registry.model
    const idField = _.get(jsonApi, 'registry.structure.id', 'id')
    const modelInstance = await Model.findBy(idField, params.id)
    if (modelInstance) {
      await modelInstance.delete()
    } else {
      throw JSE.ResourceObjectDoesNotExist.invoke(
        jsonApi.type,
        params.id
      )
    }
  }

  async relationships ({params, response, jsonApi}) {
    const Model = jsonApi.registry.model
    const idField = _.get(jsonApi, 'registry.structure.id', 'id')
    const modelInstance = await Model.findBy(idField, params.id)
    if (modelInstance) {
      const relationshipHandler = JsonApiRelationshipHandler.init(jsonApi, modelInstance)
      relationshipHandler.extractRelation(params.relationship)
      await modelInstance.load(params.relationship)
      const relationships = modelInstance.toJSON().data.relationships
      response.status(HttpStatus.OK)
        .send(relationships[params.relationship])
    } else {
      throw JSE.ResourceObjectDoesNotExist.invoke(
        jsonApi.type,
        params.id
      )
    }
  }
}

module.exports = ResourceController
