'use strict';

const {LogicalException} = require('@adonisjs/generic-exceptions');

class NotAcceptable extends LogicalException {
    handle(error, {response}) {
        response.status(406).send('Not Acceptable');
    }
}

module.exports = NotAcceptable;
