'use strict'

const {formatters} = use('Validator')
const JsonApiErrorHandler = use('JsonApiErrorHandler')

class ResourceValidator {
  get data () {
    return this.ctx.jsonApi.data
  }

  get formatter () {
    return formatters.JsonApi
  }

  async fails (validation) {
    JsonApiErrorHandler.handleValidationErrors(validation, this.ctx.response)
  }
}

module.exports = ResourceValidator
