'use strict';

const _ = require('lodash');
const JSONApiSerializerService = use('DineV/JSONApiService').Serializer;
const VanillaSerializer = require("@adonisjs/lucid/src/Lucid/Serializers/Vanilla");

class JsonApiSerializer extends VanillaSerializer {
    toJSON() {
        let json = {};
        if (this.isOne) {
            json = this._getRowJSON(this.rows)
        } else {
            json = this.rows.map(this._getRowJSON.bind(this));
            if (this.pages) {
                json = _.merge({}, this.pages, {data})
            }
        }

        return JSONApiSerializerService.serialize(this.rows.constructor.jsonApiType, json);
    }
}

module.exports = JsonApiSerializer;
