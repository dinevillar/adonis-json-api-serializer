'use strict';

const _ = require('lodash');
const qs = require('qs');
const VanillaSerializer = require("@adonisjs/lucid/src/Lucid/Serializers/Vanilla");
const {TypeNotDefinedException} = require("../Exceptions");

const JsonApi = use('JsonApi');
const Logger = use('Logger');

class LucidSerializer extends VanillaSerializer {
    toJSON() {
        let returnJson = null;
        if (this.isOne) {
            const jsonApiType = JsonApi.getTypeOfModel(this.rows.constructor.name);
            if (jsonApiType !== undefined) {
                try {
                    returnJson = JsonApi.JsonApiSerializer.serialize(
                        jsonApiType,
                        this._getRowJSON(this.rows)
                    );
                } catch (error) {
                    Logger.warning(error);
                }
            } else {
                throw TypeNotDefinedException.invoke(this.rows.constructor.name);
            }
        } else {
            const jsonApiType = JsonApi.getTypeOfModel(this.rows[0].constructor.name);
            const data = this.rows.map(this._getRowJSON.bind(this));
            if (jsonApiType !== undefined) {
                try {
                    if (this.pages) {
                        returnJson = JsonApi.JsonApiSerializer.serialize(jsonApiType, data);
                        if (_.has(returnJson, 'links.self')) {
                            this._setPageLinks(returnJson.links, returnJson.links.self);
                        }
                        returnJson.meta = _.merge({}, returnJson.meta, {
                            "page": {
                                'number': parseInt(this.pages.page),
                                'size': parseInt(this.pages.perPage),
                                'pages': parseInt(this.pages.lastPage)
                            },
                            'total': parseInt(this.pages.total)
                        });
                    } else {
                        returnJson = JsonApi.JsonApiSerializer.serialize(jsonApiType, data);
                        returnJson.meta = _.merge({}, returnJson.meta, {'total': this.rows.length});
                    }
                } catch (error) {
                    Logger.warning(error);
                }
            } else {
                throw TypeNotDefinedException.invoke(this.rows[0].constructor.name);
            }
        }
        if (returnJson) {
            returnJson = JsonApi.setCommon(returnJson)
        }
        return returnJson;
    }

    _setPageLinks(links, refLink) {
        links.first = refLink + '?' + qs.stringify({
            page: {
                number: 1,
                size: this.pages.perPage
            }
        });
        links.prev = refLink + '?' + qs.stringify({
            page: {
                number: this.pages.page > 1 ? (this.pages.page - 1) : 1,
                size: this.pages.perPage
            }
        });
        links.next = refLink + '?' + qs.stringify({
            page: {
                number: this.pages.page >= this.pages.lastPage ? this.pages.lastPage : (parseInt(this.pages.page) + 1),
                size: this.pages.perPage
            }
        });
        links.last = refLink + '?' + qs.stringify({
            page: {
                number: this.pages.lastPage,
                size: this.pages.perPage
            }
        });
        links.self = refLink + '?' + qs.stringify({
            page: {
                number: this.pages.page,
                size: this.pages.perPage
            }
        });
    }
}

module.exports = LucidSerializer;
