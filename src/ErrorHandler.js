'use strict'

const _ = require('lodash')
const JsonApiException = require('./Exceptions/JsonApiException')
const JSE = require('./specification-exceptions')

class JsonApiErrorHandler {
  constructor (Config) {
    this.topLevelMeta = Config.get('jsonApi.globalOptions.topLevelMeta', {})
    this.includeStackTraceInErrors = Config.get('jsonApi.includeStackTraceInErrors', true)
    this.jsonApiErrors = []
  }

  async handleError (error, response, add = false) {
    const jsonApiError = this.parseError(error)
    this.jsonApiErrors.push(jsonApiError)
    if (!add) {
      return this.send(response)
    }
  }

  async handleValidationErrors ({errors}, response) {
    for (const error of errors) {
      const jsonError = JSE.UnprocessableResourceObject.invoke()
      jsonError.detail = error.detail
      jsonError.source = error.source
      this.handleError(jsonError, response, true)
    }
    this.send(response)
  }

  async send (response) {
    await response.status(this.getStatus()).send(this.getErrorObjectJson())
    this.jsonApiErrors = []
  }

  parseError (error) {
    let jsonApiError = error
    if (!(error instanceof JsonApiException)) {
      jsonApiError = JsonApiException.invokeFromError(error)
    }
    if (this.includeStackTraceInErrors) {
      jsonApiError.meta = {
        stack: error.stack.split(/\r?\n/)
      }
    }
    return jsonApiError.toJSON()
  }

  getStatus () {
    if (this.jsonApiErrors.length > 1) {
      let status400 = 0
      let status500 = 0
      for (const jsonApiError of this.jsonApiErrors) {
        if (_.inRange(jsonApiError.status, 400, 499)) {
          status400++
        } else {
          status500++
        }
      }
      return (status400 > status500) ? 400 : 500
    } else {
      return this.jsonApiErrors[0].status
    }
  }

  getErrorObjectJson () {
    const errorJson = {
      jsonapi: {
        version: '1.0'
      },
      errors: this.jsonApiErrors
    }
    errorJson['meta'] = Object.assign(
      {}, errorJson.meta,
      this.topLevelMeta
    )
    return errorJson
  }
}

module.exports = JsonApiErrorHandler
