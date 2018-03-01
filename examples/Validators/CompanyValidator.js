'use strict'

const {formatters} = use('Validator')
const JsonApi = use('JsonApi')

class CompanyValidator {
  get rules () {
    if (this.ctx.request.method() === 'PATCH') {
      return {
        'name': 'max:255',
        'contact_number': 'max:50',
        'email': 'email|unique:companies,email|max:100',
        'web_address': 'max:255',
        'address_line_1': 'max:255',
        'address_line_2': 'max:255',
        'city': 'max:100',
        'postal_code': 'max:50',
        'country': 'max:3'
      }
    } else {
      return {
        'name': 'required|accepted|max:255',
        'contact_number': 'required|accepted|max:50',
        'email': 'required|email|unique:companies,email|max:100',
        'web_address': 'max:255',
        'address_line_1': 'max:255',
        'address_line_2': 'max:255',
        'city': 'max:100',
        'postal_code': 'required|accepted|max:50',
        'country': 'required|accepted|max:3'
      }
    }
  }

  get sanitizationRules () {
    return {
      'email': 'normalize_email'
    }
  }

  get formatter () {
    return formatters.JsonApi
  }

  get validateAll () {
    return true
  }

  async fails ({errors}) {
    for (const error of errors) {
      const jsonError = JsonApi.JSE.UnprocessableResourceObject.invoke()
      jsonError.detail = error.detail
      jsonError.source = error.source
      JsonApi.pushError(jsonError)
    }
    return this.ctx.response
      .status(JsonApi.getJsonErrorStatus())
      .send(JsonApi.getJsonError())
  }
}

module.exports = CompanyValidator
