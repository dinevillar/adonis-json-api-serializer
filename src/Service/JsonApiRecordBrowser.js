'use strict';

const _ = require('lodash');
const {TypeNotDefinedException} = require("../Exceptions");

class JsonApiRecordBrowser {

    static model(model) {
        return new this(model);
    }

    constructor(model) {
        this._model = use(model);
        if (this._model.hasOwnProperty('jsonApiType')) {
            this._jsonApiType = this._model.jsonApiType;
        } else {
            throw TypeNotDefinedException.invoke(this._model.name);
        }
        this._includes = [];
        this._fields = {};
        this._page = {};
        this._filter = {};
        this._sort = [];
    }

    request(request) {
        const {include, fields, page, filter, sort} = request.all();
        this.includes(include);
        this.fields(fields);
        this.page(page);
        this.filter(filter);
        this.sort(sort);
        return this;
    }

    includes(include) {
        this._includes = _.union(this._includes, _.map(include.split(','), _.trim));
        return this;
    }

    fields(fields) {
        this._fields = Object.assign(this._fields, _.mapValues(fields, (val) => {
            return _.map(val.split(','), _.trim)
        }));
        return this;
    }

    filter(filter) {
        this._filter = Object.assign(this._filter, _.mapValues(filter, (val) => {
            const vals = val.split(',');
            return vals.length > 1 ? _.map(vals, _.trim) : _.trim(val);
        }));
        return this;
    }

    page(page) {
        this._page = page;
        return this;
    }

    sort(sort) {
        this._sort = _.union(this._sort, _.map(sort.split(','), _.trim));
        return this;
    }

    _buildQuery() {
        const query = this._model.query();
        if (!_.isEmpty(this._fields) && _.has(this._fields, this._jsonApiType)) {
            query.select(this._fields[this._jsonApiType]);
        }
        if (!_.isEmpty(this._filter)) {
            query.where(this._filter);
        }
        if (!_.isEmpty(this._includes)) {
            for (const include of this._includes) {
                query.with(include);
            }
        }
        if (!_.isEmpty(this._sort)) {
            for (const sort of this._sort) {
                if (_.startsWith(sort, '-')) {
                    query.orderBy(sort, 'desc');
                } else {
                    query.orderBy(sort, 'asc');
                }
            }
        }
        return query;
    }

    async first() {
        this._buildQuery();
        return this.query.first();
    }

    async fetch() {
        this._buildQuery();
        return this.query.fetch();
    }

    async paginate() {
        this._buildQuery();
        return this.query.paginate(this._page.number, this._page.size);
    }

}

module.exports = JsonApiRecordBrowser;
