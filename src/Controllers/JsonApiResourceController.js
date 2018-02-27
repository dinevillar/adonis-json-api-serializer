'use strict';

const _ = require('lodash');
const JSE = require('../specification-exceptions');
const RB = use('JsonApiRecordBrowser');
const Serializer = use('JsonApiSerializer');
const HttpStatus = require('http-status-codes');
const BaseRelation = require("@adonisjs/lucid/src/Lucid/Relations/BaseRelation");

class JsonApiResourceController {

    async index({request, response, jsonApi}) {
        const modelInstances = await RB.init(jsonApi)
            .request(request.get())
            .paginateOrFetch();
        response.status(HttpStatus.OK)
            .send(modelInstances.toJSON());
    }

    async store({request, response, jsonApi}) {
        const Model = jsonApi.registry.model;
        let data = jsonApi.data;
        if (typeof Model.writeable === 'object') {
            data = _.pick(data, Model.writeable);
        }
        const modelInstance = await Model.create(data);
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

    async destroy() {

    }

    async relationships({params, response, jsonApi}) {
        const Model = jsonApi.registry.model;
        const modelInstance = await Model.findBy('uid', params.id);
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

module.exports = JsonApiResourceController;
