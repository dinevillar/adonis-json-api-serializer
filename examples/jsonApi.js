'use strict';

module.exports = {
    "mediaType": "application/vnd.api+json",
    "globalOptions": {
        "convertCase": "snake_case",
        "unconvertCase": "camelCase"
    },
    "commonMeta": {
        "copyright": "Copyright " + (new Date()).getFullYear() + " Example Corporation",
        "documentation": "http://example.com/docs",
        "authors": [
            "John Doe - john@example.com"
        ]
    },
    // Register JSON API Types here..
    // For more info on structure: https://github.com/danivek/json-api-serializer
    "registry": {
        "user": { //JSON API Type
            "model": "App/Models/User", //Lucid Model Namespace
            "structure": {
                "links": {
                    self: (data) => {
                        return '/users/' + data.id
                    }
                },
                "topLevelLinks": {
                    self: '/users'
                }
            }
        }
    }
};
