'use strict';

const _ = require('lodash');
const JSONApiSerializer = use('JsonApi/Service').Serializer;
const VanillaSerializer = require("@adonisjs/lucid/src/Lucid/Serializers/Vanilla");

class LucidSerializer extends VanillaSerializer {
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
        if (this.rows.constructor.hasOwnProperty('jsonApiType')) {
            try {
                return JSONApiSerializer.serialize(this.rows.constructor.jsonApiType, json);
            } catch (error) {

            }
        } else {
            return json;
        }
    }
}

module.exports = LucidSerializer;
