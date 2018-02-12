'use strict';

const _ = require('lodash');
const qs = require('qs');
const VanillaSerializer = require("@adonisjs/lucid/src/Lucid/Serializers/Vanilla");
const {TypeNotDefinedException} = require("../Exceptions");

const {JsonApiSerializer} = use('JsonApi');
const Logger = use('Logger');

class LucidSerializer extends VanillaSerializer {
    toJSON() {
        if (this.isOne) {
            this._getRowJSON(this.rows);
            if (this.rows.constructor.hasOwnProperty('jsonApiType')) {
                try {
                    return JsonApiSerializer.serialize(this.rows.constructor.jsonApiType, this.rows);
                } catch (error) {
                    Logger.warning(error);
                }
            } else {
                throw TypeNotDefinedException.invoke(this.rows.constructor.name);
            }
        } else {
            this.rows.map(this._getRowJSON.bind(this));
            if (this.rows[0].constructor.hasOwnProperty('jsonApiType')) {
                try {
                    if (this.pages) {
                        const jsonApiPaged = JsonApiSerializer.serialize(this.rows[0].constructor.jsonApiType, this.rows);
                        if (_.has(jsonApiPaged, 'links.self')) {
                            this._setPageLinks(jsonApiPaged.links, jsonApiPaged.links.self);
                        }
                        jsonApiPaged.meta = _.merge({}, {
                            'page': {
                                'number': this.pages.page,
                                'size': this.pages.perPage,
                                'pages': this.pages.lastPage
                            },
                            'total': this.pages.total
                        });
                        return jsonApiPaged;
                    } else {
                        const jsonApiList = JsonApiSerializer.serialize(this.rows[0].constructor.jsonApiType, this.rows);
                        jsonApiList.meta = _.merge({}, {'total': this.rows.length});
                        return jsonApiList;
                    }
                } catch (error) {
                    Logger.warning(error);
                }
            } else {
                throw TypeNotDefinedException.invoke(this.rows[0].constructor.name);
            }
        }
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
                number: this.pages.page >= this.pages.lastPage ? this.pages.lastPage : (this.pages.page + 1),
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
