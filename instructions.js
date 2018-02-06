'use strict';

const path = require('path');

async function createConfigFile(cli) {
    try {
        await cli.copy(path.join(__dirname, 'examples/jsonApi.js'), path.join(cli.helpers.configPath(), 'jsonApi.js'));
        cli.command.completed('create', 'config/jsonApi.js')
    } catch (e) {
    }
}

module.exports = async function (cli) {
    createConfigFile(cli)
};