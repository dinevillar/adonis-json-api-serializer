'use strict'

const _ = require('lodash')
const TypeNotDefinedException = require('./Exceptions/TypeNotDefinedException')
const JsonApiSerializer = use('JsonApiSerializer')

class RecordBrowser {
  static init ({type, registry}) {
    return new this(type, registry.model)
  }

  constructor (type, model) {
    this._jsonApiType = type
    if (!JsonApiSerializer.getSchema(this._jsonApiType)) {
      throw TypeNotDefinedException.invoke(type)
    }
    this._model = model
    this._modelInstance = new model()
    this._includes = []
    this._fields = {}
    this._page = {}
    this._filter = {}
    this._sort = []
  }

  request ({include, fields, page, filter, sort}) {
    this.includes(include)
    this.fields(fields)
    this.page(page)
    this.filter(filter)
    this.sort(sort)
    return this
  }

  includes (include) {
    if (include) {
      include = '' + include
      this._includes = _.union(this._includes, _.map(include.split(','), _.trim))
    }
    return this
  }

  fields (fields) {
    _.forEach(fields, (value, key) => {
      value = '' + value
      if (!this._fields.hasOwnProperty(key)) {
        this._fields[key] = []
      }
      this._fields[key] = _.union(this._fields[key], _.map(value.split(','), _.trim))
    })
    return this
  }

  filter (filter) {
    _.forEach(filter, (value, key) => {
      value = '' + value
      if (!this._filter.hasOwnProperty(key)) {
        this._filter[key] = []
      }
      this._filter[key] = _.union(this._filter[key], _.map(value.split(','), _.trim))
    })
    return this
  }

  page (page) {
    this._page = page
    return this
  }

  sort (sort) {
    if (sort) {
      sort = '' + sort
      this._sort = _.union(this._sort, _.map(sort.split(','), _.trim))
    }
    return this
  }

  _buildQuery () {
    const query = this._model.query()
    const hasSparseForModel = !_.isEmpty(this._fields) && _.has(this._fields, this._jsonApiType)
    if (!_.isEmpty(this._includes)) {
      for (let include of this._includes) {
        if (typeof this._modelInstance[include] === 'function') {
          const relation = this._modelInstance[include]()
          if (hasSparseForModel && relation.constructor.name === 'BelongsTo') {
            this.fields({[this._jsonApiType]: relation.primaryKey})
          }
          const relatedJsonApiType = JsonApiSerializer.getTypeOfModel(relation.RelatedModel.name)
          const hasSparseForInclude = !_.isEmpty(this._fields) && _.has(this._fields, relatedJsonApiType)
          if (hasSparseForInclude) {
            this.fields({[relatedJsonApiType]: _.get(JsonApiSerializer.getRegistry(relatedJsonApiType), 'structure.id', 'id')})
            this.fields({[relatedJsonApiType]: relation.RelatedModel.primaryKey})
            query.with(include, (includeQuery) => {
              includeQuery.select(this._fields[relatedJsonApiType])
            })
          } else {
            query.with(include)
          }
        }
      }
    }
    if (hasSparseForModel) {
      this.fields({[this._jsonApiType]: _.get(JsonApiSerializer.getRegistry(this._jsonApiType), 'structure.id', 'id')})
      query.select(this._fields[this._jsonApiType])
    }
    if (!_.isEmpty(this._filter)) {
      query.where(this._filter)
    }
    if (!_.isEmpty(this._sort)) {
      for (const sort of this._sort) {
        if (_.startsWith(sort, '-')) {
          query.orderBy(sort.replace('-', ''), 'desc')
        } else {
          query.orderBy(sort, 'asc')
        }
      }
    }
    return query
  }

  async first () {
    return this._buildQuery().first()
  }

  async fetch () {
    return this._buildQuery().fetch()
  }

  async paginate () {
    return this._buildQuery().paginate(this._page.number, this._page.size)
  }

  async paginateOrFetch () {
    if (_.isEmpty(this._page)) {
      return this.fetch()
    } else {
      return this.paginate()
    }
  }
}

module.exports = RecordBrowser
