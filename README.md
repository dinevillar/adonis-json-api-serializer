## Installation

`npm i @dinevillar/adonis-json-api-serializer`

## Setup
Create/edit ``config/jsonApi.js``.

``` javascript
module.exports = {
      "globalOptions": {
          "convertCase": "snake_case",
          "unconvertCase": "camelCase"
      },
      // Register JSON API Types here..
      "registry": {
          "user": {
              "model": 'App/Models/User'
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

```

> Add as provider (start/app.js)

``` javascript
const providers = [
	'adonis-json-api-serializer/providers/JsonApiProvider'
]
```

> Add to your Models
``` javascript
static get Serializer() {
    return 'JsonApi/Serializer/LucidSerializer'; // Override Lucid/VanillaSerializer
};
```

> Add as named Middleware in start/kernel.js
``` javascript
const namedMiddleware = {
  jsonApi: 'JsonApi/Middleware/Specification'
};
```

> Use in your routes
``` javascript
// All request and response to /user must conform to JSON API v1
Route.resource('user', 'UserController')
    .middleware(['auth', 'jsonApi'])
```
You can use the "cn" and "ro" schemes of the middleware.
- Adding "cn" (jsonApi:cn) will allow middleware to check for [Content Negotiation](http://jsonapi.org/format/#content-negotiation)
- Adding "ro" (jsonApi:ro) will allow middleware to check if request body for POST and PATCH conforms with [JSON API resource object rules](http://jsonapi.org/format/#crud)
- Adding "ro" (jsonApi:ro) also will automatically deserialize resource objects.
- If none is specified then both will be applied

## Usage
#### model.toJSON():
``` javascript
getUser({request, response}) {
  const user = await User.find(1);
  response.send(user.toJSON());
};
```

#### with relations:
> `config/jsonApi.js`
``` javascript
"registry": {
	"company": {
	    "model": 'App/Models/Company',
	    "structure": {
            id: "id",
            links: {
                self: (data) => {
                  return '/companies/' + data.id
                }
            }
		}
	}
	"user": {
	    "model": 'App/Models/User',
	    "structure": {
            "links": {
                self: (data) => {
                    return '/users/' + data.id
                }
            },
            "relationships": {
                company: {
                  type: 'company',
                  links: {
                    self: '/companies'
                  }
                }
            }
            "topLevelLinks": {
                self: '/users'
            }
		}
  	}
 }
```
> App/Models/Company
``` javascript
static get Serializer() {
    return 'JsonApi/Serializer/LucidSerializer';
};
```

> App/Models/User
``` javascript
static get Serializer() {
    return 'JsonApi/Serializer/LucidSerializer';
};
```

> Somewhere:
``` javascript
getUser({request, response}) {
  const user = await User.find(1);
  await user.load('company'); // load relation
  response.send(user.toJSON());
};
```

#### Record Browser in your Controllers
``` javascript
const Company = use('App/Models/Company')
const JsonApiRB = use('JsonApiRecordBrowser');
const companies = await JsonApiRB
  .model(Company)
  .request(request.get()) //handle request
  .paginateOrFetch();
response.send(companies.toJSON());
```
The record browser supports:
- [Pagination](http://jsonapi.org/format/#fetching-pagination)
- [Sparse Fieldsets](http://jsonapi.org/format/#fetching-sparse-fieldsets)
- [Inclusion of Related Resources](http://jsonapi.org/format/#fetching-includes)
- [Filtering](http://jsonapi.org/format/#fetching-filtering)
- [Sorting](http://jsonapi.org/format/#fetching-sorting)

#### Exceptions
You can use JsonApi to handle errors and be able to return valid JSON Api error responses.
Create a global ehandler using `adonis make:ehandler` and use JsonApi in `handle()` function.
See `examples/Exception/Handler.js`

``` javascript
async handle(error, options) {
    JsonApi.handleError(error, options);
}
```

#### Serializer Library:
> [Serializer functions](https://github.com/danivek/json-api-serializer/blob/master/lib/JSONAPISerializer.js)
``` javascript
const {JsonApiSerializer} = use('JsonApi');
const user = await User.find(1);
JsonApiSerializer.serialize("user", user);
```