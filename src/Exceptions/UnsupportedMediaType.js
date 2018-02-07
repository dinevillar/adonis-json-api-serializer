'use strict';

const {LogicalException} = require('@adonisjs/generic-exceptions');

class UnsupportedMediaType extends LogicalException {
    handle(error, {response}) {
        response.status(415).send('Unsupported Media Type');
    }
}

module.exports = UnsupportedMediaType;
