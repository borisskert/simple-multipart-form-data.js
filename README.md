# simple multipart form data

Simple builder to create form-data to be send via nodejs' http/https module without using any npm packages.

## Build

No build necessary! Just copy the file `multipart-form-data.js` into your project!

## Usage

Append key/value pairs:

```javascript
import {MultipartFormDataBuilder} from './multipart-form-data'

const formDataBuilder = MultipartFormDataBuilder()

formDataBuilder.append('first_name', 'Boris')
formDataBuilder.append('last_name', 'Skert')
formDataBuilder.append('year_of_birth', 1980)
```

Append a file:

```javascript
formDataBuilder.appendFile(
  'my_upload_file',
  Buffer.from('abc'),
  'picture.jpg',
  'image/jpeg'
)
```

Send via nodejs' http module:

```javascript
const http = require('http')

const formData = formDataBuilder.build()

const options = {
  hostname: 'localhost',
  path: '/api/data',
  method: 'POST',
  headers: formData.headers
}

const query = http.request(options, (response) => {
  response.on('data', chunk => {
    //...
  })
  response.on('end', () => {
    //...
  })
})

query.on('error', (e) => {
  console.log(e)
})

query.write(formData.body);
query.end();
```
