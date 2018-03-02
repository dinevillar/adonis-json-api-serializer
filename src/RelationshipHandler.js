'use strict'

const _ = require('lodash')
const JSE = require('./specification-exceptions')
const BaseRelation = require('@adonisjs/lucid/src/Lucid/Relations/BaseRelation')
const JsonApiSerializer = use('JsonApiSerializer')

class RelationshipHandler {

  static init (jsonApi, modelInstance) {
    return new this(jsonApi, modelInstance)
  }

  constructor (jsonApi, modelInstance) {
    this.modelInstance = modelInstance
    this.jsonApi = jsonApi
  }

  extractRelation (relationField) {
    if (_.has(this.jsonApi.registry, 'structure.relationships.' + relationField) &&
      typeof this.modelInstance[relationField] === 'function') {
      const relationInstance = this.modelInstance[relationField]()
      if (relationInstance instanceof BaseRelation) {
        return relationInstance
      }
    }
    throw JSE.RelationshipDoesNotExist.invoke(
      this.jsonApi.type,
      relationField
    )
  }

  async handleRelationshipUpdate (relationships) {

    const postLoad = []
    let relatedIdField = 'id'

    for (const relationField in relationships) {
      const LucidRelation = this.extractRelation(relationField)
      const relationship = relationships[relationField]

      switch (LucidRelation.constructor.name) {
        case 'BelongsTo':
          relatedIdField = _.get(JsonApiSerializer.getRegistry(relationship.data.type), 'structure.id', 'id')
          const relatedModelInstance = await LucidRelation.RelatedModel.findBy(relatedIdField, this.jsonApi.data[relationField])
          if (!relatedModelInstance) {
            throw JSE.ResourceObjectDoesNotExist.invoke(
              relationship.data.type,
              data[relationField]
            )
          }
          await LucidRelation.associate(relatedModelInstance)
          if (postLoad.indexOf(relationField) <= -1) {
            postLoad.push(relationField)
          }
          break
        case 'HasOne':
        case 'HasMany':
        case 'BelongsToMany':
          const relatedData = Array.isArray(this.jsonApi.data[relationField]) ? this.jsonApi.data[relationField] : [this.jsonApi.data[relationField]]
          const disallowedBulkUpdates = _.get(this.jsonApi, 'registry.disallowedBulkUpdates', [])

          if (relatedData.length > 1 && disallowedBulkUpdates.indexOf(relationField) > -1) {
            throw JSE.BulkRelationshipUpdateIsNotAllowed.invoke(
              this.jsonApi.type,
              relationField
            )
          }
          relatedIdField = _.get(JsonApiSerializer.getRegistry(relationship.data[0].type), 'structure.id', 'id')
          for (const id of relatedData) {
            const relatedModelInstance = await LucidRelation.RelatedModel.findBy(relatedIdField, id)
            if (relatedModelInstance) {
              if (LucidRelation.constructor.name === 'BelongsToMany') {
                await LucidRelation.attach([relatedModelInstance.id])
              } else {
                await LucidRelation.save(relatedModelInstance)
              }
              if (postLoad.indexOf(relationField) <= -1) {
                postLoad.push(relationField)
              }
            } else {
              throw JSE.ResourceObjectDoesNotExist.invoke(
                relationship.data[0].type,
                id
              )
            }
          }

          const currentRelatedModelInstances = await LucidRelation.fetch()
          if (currentRelatedModelInstances.size()) {
            const currentRelatedIds = _.map(currentRelatedModelInstances.toJSON().data, 'id')
            const diffIds = _.difference(currentRelatedIds, relatedData)
            for (const diffId of diffIds) {
              const relatedModelInstance = await LucidRelation.RelatedModel.findBy(relatedIdField, diffId)
              if (relatedModelInstance) {
                try {
                  if (LucidRelation.constructor.name === 'BelongsToMany') {
                    await LucidRelation.detach([relatedModelInstance.id])
                  } else {
                    relatedModelInstance[LucidRelation.foreignKey] = null
                    await relatedModelInstance.save()
                  }
                } catch (error) {
                  if (error.code === 'ER_BAD_NULL_ERROR') {
                    await relatedModelInstance.delete()
                  }
                }
                if (postLoad.indexOf(relationField) <= -1) {
                  postLoad.push(relationField)
                }
              }
            }
          }
          break
      }
    }
    if (postLoad.length === 1) {
      await this.modelInstance.load(postLoad.shift())
    } else {
      await this.modelInstance.loadMany(postLoad)
    }
  }
}

module.exports = RelationshipHandler
