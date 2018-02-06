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

> Add as provider

``` javascript
const providers = [
	'dinevillar/adonis-json-api-serializer/providers/JSONApiProvider'
]
```

> Add to your Models
``` javascript
static get jsonApiType(){
    return "user"; // Use key in Config.get('jsonApi.registry')
}

static get Serializer() {
    return 'dinevillar/JSONApiSerializer'; // Override Lucid/VanillaSerializer
};
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
    return 'dinevillar/JSONApiSerializer';
};
```
> Somewhere:
``` javascript
getUser({request, response}) {
  const user = await User.find(1);
  await user.load('company');
  response.send(user.toJSON());
};
```
#### library:
> [Serializer functions](https://github.com/danivek/json-api-serializer/blob/master/lib/JSONAPISerializer.js)
``` javascript
const JSONApiSerializerService = use('dinevillar/JSONApiService').Serializer;
const user = await User.find(1);
JSONApiSerializerService.serialize("user", user);
```