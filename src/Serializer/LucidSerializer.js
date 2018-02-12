'use strict';

const _ = require('lodash');
const {JsonApiSerializer} = use('JsonApi');
const VanillaSerializer = require("@adonisjs/lucid/src/Lucid/Serializers/Vanilla");
const {TypeNotDefinedException} = require("../Exceptions");
const Logger = use('Logger');

class LucidSerializer extends VanillaSerializer {
    toJSON(jsonApi = false) {
        let json = {};
        if (this.isOne) {
            json = this._getRowJSON(this.rows)
        } else {
            json = this.rows.map(this._getRowJSON.bind(this));
            if (this.pages) {
                json = _.merge({}, this.pages, {data})
            }
        }
        if (jsonApi) {
            if (this.rows.constructor.hasOwnProperty('jsonApiType')) {
                try {
                    return JsonApiSerializer.serialize(this.rows.constructor.jsonApiType, json);
                } catch (error) {
                    Logger.warning(error);
                }
            } else {
                throw TypeNotDefinedException.invoke(this.rows.constructor.name);
            }
        } else {
            return json;
        }
    }
}

module.exports = LucidSerializer;
