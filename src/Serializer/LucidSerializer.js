'use strict';

const _ = require('lodash');
const {JsonApiSerializer} = use('JsonApi');
const VanillaSerializer = require("@adonisjs/lucid/src/Lucid/Serializers/Vanilla");
const CE = require("../Exceptions/specification-exceptions");

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
                return JsonApiSerializer.serialize(this.rows.constructor.jsonApiType, json);
            } catch (error) {
            }
        } else {
            throw CE.TypeNotDefined.invoke(this.rows.constructor.name);
        }
    }
}

module.exports = LucidSerializer;
