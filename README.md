## Installation

`adonis install dinevillar/adonis-json-api-serializer`

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
static get jsonApiType(){
    return "user"; // Use key in Config.get('jsonApi.registry')
}

static get Serializer() {
    return 'JsonApi/Serializer/LucidSerializer'; // Override Lucid/VanillaSerializer
};
```

> Add as named Middleware in start/kernel.js (For Content Negotiation)
``` javascript
const namedMiddleware = {
  jsonApi: 'JsonApi/Middleware/ContentNegotiation'
};
```

> Use in your routes
``` javascript
// All request and response to /user must conform to JSON API v1
Route.resource('user', 'UserController')
    .middleware(['auth', 'jsonApi'])
```

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
		id: "id",
		links: {
			self: (data) => {
			  return '/companies/' + data.id
			}
		}
	}
	"user": {
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
```
> App/Models/Company
``` javascript
static get jsonApiType(){
    return "company"; // Use key in Config.get('jsonApi.registry')
}

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
#### library:
> [Serializer functions](https://github.com/danivek/json-api-serializer/blob/master/lib/JSONAPISerializer.js)
``` javascript
const {JsonApiSerializer} = use('JsonApi');
const user = await User.find(1);
JsonApiSerializer.serialize("user", user);
```
