'use strict';

const _ = require('lodash');
const JSE = require('../../specification-exceptions');
const RB = use('JsonApiRecordBrowser');
const HttpStatus = require('http-status-codes');
const BaseRelation = require("@adonisjs/lucid/src/Lucid/Relations/BaseRelation");
const JsonApiSerializer = use('JsonApiSerializer');

class ResourceController {

    async index({request, response, jsonApi}) {
        const modelInstances = await RB.init(jsonApi)
            .request(request.get())
            .paginateOrFetch();
        response.status(HttpStatus.OK)
            .send(modelInstances.toJSON());
    }

    getRelation({registry}, relationship, modelInstance = null) {
        if (!modelInstance) {
            const Model = registry.model;
            modelInstance = new Model();
        }
        if (_.has(registry, 'structure.relationships.' + relationship) &&
            typeof modelInstance[relationship] === 'function') {
            const relationInstance = modelInstance[relationship]();
            if (relationInstance instanceof BaseRelation) {
                return relationInstance;
            }
        }
        return false;
    }

    async store({request, response, jsonApi}) {
        const Model = jsonApi.registry.model;
        let data = jsonApi.data;
        const postCreate = {};
        const postLoad = [];
        const relationships = _.get(request.all(), 'data.relationships', {});
        for (const relationField in relationships) {
            const LucidRelation = this.getRelation(jsonApi, relationField);
            const relationship = relationships[relationField];
            if (LucidRelation) {
                switch (LucidRelation.constructor.name) {
                    case 'BelongsTo':
                        const relatedIdField = _.get(JsonApiSerializer.getRegistry(relationship.data.type), 'structure.id', 'id');
                        const relatedModelInstance = await LucidRelation.RelatedModel.findBy(relatedIdField, data[relationField]);
                        if (!relatedModelInstance) {
                            throw JSE.ResourceObjectDoesNotExist.invoke(
                                relationship.data.type,
                                data[relationField]
                            );
                        }
                        data[LucidRelation.primaryKey] = relatedModelInstance[LucidRelation.foreignKey];
                        postLoad.push(relationField);
                        break;
                    case 'HasOne':
                    case 'HasMany':
                    case 'BelongsToMany':
                        const relatedData = Array.isArray(data[relationField]) ? data[relationField] : [data[relationField]];
                        const disallowedBulkUpdates = _.get(jsonApi, 'registry.disallowedBulkUpdates', []);
                        if (relatedData.length > 1 && disallowedBulkUpdates.indexOf(relationField) > -1) {
                            throw JSE.BulkRelationshipUpdateIsNotAllowed.invoke(
                                jsonApi.type,
                                relationField
                            );
                        }
                        for (const value of relatedData) {
                            const relatedIdField = _.get(JsonApiSerializer.getRegistry(relationship.data[0].type), 'structure.id', 'id');
                            const relatedModelInstance = await LucidRelation.RelatedModel.findBy(relatedIdField, value);
                            if (relatedModelInstance) {
                                if (!_.has(postCreate, relationField)) {
                                    postCreate[relationField] = [];
                                }
                                postCreate[relationField].push(relatedModelInstance);
                                if (postLoad.indexOf(relationField) <= -1) {
                                    postLoad.push(relationField);
                                }
                            } else {
                                throw JSE.ResourceObjectDoesNotExist.invoke(
                                    relationship.data[0].type,
                                    value
                                );
                            }
                        }
                        break;
                }
            } else {
                throw JSE.RelationshipDoesNotExist.invoke(
                    jsonApi.type,
                    relationField
                );
            }
        }

        if (typeof Model.writeable === 'object') {
            data = _.pick(data, Model.writeable);
        }
        const modelInstance = await Model.create(data);
        for (const relationship in postCreate) {
            if (postCreate[relationship].length === 1) {
                await modelInstance[relationship]().save(postCreate[relationship].shift());
            } else if (postCreate[relationship].length > 1) {
                await modelInstance[relationship]().saveMany(postCreate[relationship]);
            }
        }
        if (postLoad.length === 1) {
            await modelInstance.load(postLoad.shift());
        } else {
            await modelInstance.loadMany(postLoad);
        }
        const jsonModel = modelInstance.toJSON();
        delete jsonModel.included;
        response.status(HttpStatus.CREATED).send(jsonModel);
    }

    async show({params, request, response, jsonApi}) {
        const idFilter = {[_.get(jsonApi, 'registry.structure.id', 'id')]: params.id};
        const modelInstance = await RB.init(jsonApi)
            .request(request.get())
            .filter(idFilter)
            .first();
        if (modelInstance) {
            response.status(HttpStatus.OK)
                .send(modelInstance.toJSON());
        } else {
            throw JSE.ResourceObjectDoesNotExist.invoke(
                jsonApi.type,
                params.id
            );
        }
    }

    async update({params, request, response, jsonApi}) {
        const Model = jsonApi.registry.model;
        const idField = _.get(jsonApi, 'registry.structure.id', 'id');
        const modelInstance = await Model.findBy(idField, params.id);
        if (modelInstance) {
            let data = jsonApi.data;
            const postLoad = [];
            const relationships = _.get(request.all(), 'data.relationships', {});
            let relatedIdField = 'id';
            for (const relationField in relationships) {
                const LucidRelation = this.getRelation(jsonApi, relationField, modelInstance);
                const relationship = relationships[relationField];
                if (LucidRelation) {
                    switch (LucidRelation.constructor.name) {
                        case 'HasOne':
                        case 'BelongsTo':
                            relatedIdField = _.get(JsonApiSerializer.getRegistry(relationship.data.type), 'structure.id', 'id');
                            const relatedModelInstance = await LucidRelation.RelatedModel.findBy(relatedIdField, data[relationField]);
                            if (!relatedModelInstance) {
                                throw JSE.ResourceObjectDoesNotExist.invoke(
                                    relationship.data.type,
                                    data[relationField]
                                );
                            }
                            if (LucidRelation.constructor.name === 'BelongsTo') {
                                await modelInstance[relationField]().associate(relatedModelInstance);
                            } else {
                                await modelInstance[relationField]().save(relatedModelInstance);
                            }
                            postLoad.push(relationField);
                            break;
                        case 'HasMany':
                        case 'BelongsToMany':
                            const relatedData = Array.isArray(data[relationField]) ? data[relationField] : [data[relationField]];
                            const disallowedBulkUpdates = _.get(jsonApi, 'registry.disallowedBulkUpdates', []);
                            if (relatedData.length > 1 && disallowedBulkUpdates.indexOf(relationField) > -1) {
                                throw JSE.BulkRelationshipUpdateIsNotAllowed.invoke(
                                    jsonApi.type,
                                    relationField
                                );
                            }
                            relatedIdField = _.get(JsonApiSerializer.getRegistry(relationship.data[0].type), 'structure.id', 'id');
                            const currentRelatedModelInstances = await LucidRelation.fetch();
                            const currentRelatedIds = _.map(currentRelatedModelInstances.toJSON().data, 'id');
                            const diffIds = _.difference(currentRelatedIds, relatedData);

                            for (const value of relatedData) {
                                const relatedModelInstance = await LucidRelation.RelatedModel.findBy(relatedIdField, value);
                                if (relatedModelInstance) {
                                    await modelInstance[relationField]().save(relatedModelInstance);
                                    if (postLoad.indexOf(relationField) <= -1) {
                                        postLoad.push(relationField);
                                    }
                                } else {
                                    throw JSE.ResourceObjectDoesNotExist.invoke(
                                        relationship.data[0].type,
                                        value
                                    );
                                }
                            }

                            for (const diffId of diffIds) {

                            }
                            break;
                    }
                }
            }
            if (typeof Model.writeable === 'object') {
                data = _.pick(data, Model.writeable);
            }
            modelInstance.merge(data);
            await modelInstance.save();
            response
                .status(HttpStatus.OK)
                .send(modelInstance.toJSON());
        } else {
            throw JSE.ResourceObjectDoesNotExist.invoke(
                jsonApi.type,
                params.id
            );
        }
    }

    async destroy({params, response, jsonApi}) {
        const Model = jsonApi.registry.model;
        const idField = _.get(jsonApi, 'registry.structure.id', 'id');
        const modelInstance = await Model.findBy(idField, params.id);
        if (modelInstance) {
            await modelInstance.delete();
        } else {
            throw JSE.ResourceObjectDoesNotExist.invoke(
                jsonApi.type,
                params.id
            );
        }
    }

    async relationships({params, response, jsonApi}) {
        const Model = jsonApi.registry.model;
        const idField = _.get(jsonApi, 'registry.structure.id', 'id');
        const modelInstance = await Model.findBy(idField, params.id);
        if (modelInstance) {
            if (this.getRelation(jsonApi, params.relationship)) {
                await modelInstance.load(params.relationship);
                const relationships = modelInstance.toJSON().data.relationships;
                response.status(HttpStatus.OK)
                    .send(relationships[params.relationship]);
            } else {
                throw JSE.RelationshipDoesNotExist.invoke(
                    jsonApi.type,
                    params.relationship
                );
            }
        } else {
            throw JSE.ResourceObjectDoesNotExist.invoke(
                jsonApi.type,
                params.id
            );
        }
    }

}

module.exports = ResourceController;
