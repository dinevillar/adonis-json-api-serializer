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

    getRelation({registry}, relationship) {
        const Model = registry.model;
        const modelInstance = new Model();
        const relation = modelInstance[relationship];
        if (_.has(registry, 'structure.relationships.' + relationship) &&
            typeof relation === 'function') {
            const relationInstance = relation();
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
        const relationships = _.get(request.all(), 'data.relationships', false);
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
                        break;
                    case 'HasOne':
                    case 'HasMany':
                        const relatedData = Array.isArray(data[relationField]) ? data[relationField] : [data[relationField]];
                        for (const value of relatedData) {
                            const relatedIdField = _.get(JsonApiSerializer.getRegistry(relationship.data[0].type), 'structure.id', 'id');
                            const relatedModelInstance = await LucidRelation.RelatedModel.findBy(relatedIdField, value);
                            if (relatedModelInstance) {
                                if (!_.has(postCreate, relationField)) {
                                    postCreate[relationField] = [];
                                }
                                postCreate[relationField].push(relatedModelInstance);
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
            } else if (postCreate[relationship] > 1) {
                await modelInstance[relationship]().saveMany(postCreate[relationship]);
            }
        }
        response.status(HttpStatus.CREATED).send(modelInstance.toJSON());
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
            if (typeof modelInstance[params.relationship] === 'function' &&
                (modelInstance[params.relationship]() instanceof BaseRelation)) {
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
