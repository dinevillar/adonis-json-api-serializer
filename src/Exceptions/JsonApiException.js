'use strict';

const {HttpException} = require('node-exceptions');

class JsonApiException extends HttpException {
  constructor(title, status, code, detail, source, id, links, meta) {
    super(title, status, code);

    Object.defineProperty(this, 'title', {
      configurable: true,
      enumerable: false,
      value: title,
      writable: true
    });

    Object.defineProperty(this, 'detail', {
      configurable: true,
      enumerable: false,
      value: detail,
      writable: true
    });

    Object.defineProperty(this, 'status', {
      configurable: true,
      enumerable: false,
      value: status || 500,
      writable: true
    });

    Object.defineProperty(this, 'source', {
      configurable: true,
      enumerable: false,
      value: source || {pointer: ""},
      writable: true
    });

    Object.defineProperty(this, 'code', {
      configurable: true,
      enumerable: false,
      value: code || "E_JSON_API",
      writable: true
    });

    Object.defineProperty(this, 'id', {
      configurable: true,
      enumerable: false,
      value: id,
      writable: true
    });

    Object.defineProperty(this, 'links', {
      configurable: true,
      enumerable: false,
      value: links,
      writable: true
    });

    Object.defineProperty(this, 'meta', {
      configurable: true,
      enumerable: false,
      value: meta,
      writable: true
    });
  }

  static invokeFromError(error) {
    return new this(error.name, error.status, error.code, error.message);
  }

  toJSON() {
    return {
      title: this.title,
      detail: this.detail,
      status: this.status,
      source: this.source,
      code: this.code,
      id: this.id,
      links: this.links,
      meta: this.meta,
    }
  }
}

module.exports = JsonApiException;
