import test from 'ava'
import { MultipartFormData, MultipartFormDataBuilder } from './multipart-form-data'

test('should create header/body with one property', t => {
  const formDataBuilder = MultipartFormDataBuilder()
  formDataBuilder.append('my_key', 'my_value')
  const formData = formDataBuilder.build()

  const actualContentType = formData.headers['Content-Type']
  t.regex(actualContentType, /multipart\/form-Data; boundary=--.+/gi)

  const actualBoundary = /multipart\/form-Data; boundary=--(.+)/gi.exec(actualContentType)[1]

  t.is(formData.body.toString(), `\r\n----${actualBoundary}\r\nContent-Disposition: form-data; name="my_key"\r\n\r\nmy_value\r\n----${actualBoundary}--`)
})

test('should create header/body with two properties', t => {
  const formDataBuilder = MultipartFormDataBuilder()
  formDataBuilder.append('my_key_one', 'my_value_one')
  formDataBuilder.append('my_key_two', 'my_value_two')
  const formData = formDataBuilder.build()

  const actualContentType = formData.headers['Content-Type']
  t.regex(actualContentType, /multipart\/form-Data; boundary=--.+/gi)

  const actualBoundary = /multipart\/form-Data; boundary=--(.+)/gi.exec(actualContentType)[1]

  t.is(formData.body.toString(), `\r\n----${actualBoundary}\r\nContent-Disposition: form-data; name="my_key_one"\r\n\r\nmy_value_one\r\n----${actualBoundary}\r\nContent-Disposition: form-data; name="my_key_two"\r\n\r\nmy_value_two\r\n----${actualBoundary}--`)
})

test('should create header/body with two properties and a file', t => {
  const formDataBuilder = MultipartFormDataBuilder()
  formDataBuilder.append('my_key_one', 'my_value_one')
  formDataBuilder.append('my_key_two', 'my_value_two')
  formDataBuilder.appendFile('my_upload_file', Buffer.from('abc'), 'my-filename.txt', 'text/plain')
  const formData = formDataBuilder.build()

  const actualContentType = formData.headers['Content-Type']
  t.regex(actualContentType, /multipart\/form-Data; boundary=--.+/gi)

  const actualBoundary = /multipart\/form-Data; boundary=--(.+)/gi.exec(actualContentType)[1]

  t.is(formData.body.toString(), `\r\n----${actualBoundary}\r\nContent-Disposition: form-data; name="my_key_one"\r\n\r\nmy_value_one\r\n----${actualBoundary}\r\nContent-Disposition: form-data; name="my_key_two"\r\n\r\nmy_value_two\r\n----${actualBoundary}\r\nContent-Disposition: form-data; name="my_upload_file"; filename="my-filename.txt"\r\nContent-Type: text/plain\r\n\r\nabc\r\n----${actualBoundary}--`)
})

test('should parse body with one property', t => {
  const parsedBody = MultipartFormData(
    {
      'Content-Type': 'Multipart/Form-Data; boundary=--MySpecialBoundary'
    },
    '--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_key"\r\n\r\nmy_value\r\n--MySpecialBoundary--'
  ).parse()

  t.is(parsedBody['my_key'], 'my_value')
})

test('should parse body with two properties', t => {
  const parsedBody = MultipartFormData(
    {
      'Content-Type': 'Multipart/Form-Data; boundary=--MySpecialBoundary'
    },
    '--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_key_one"\r\n\r\nmy_value_one\r\n--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_key_two"\r\n\r\nmy_value_two\r\n--MySpecialBoundary--'
  ).parse()

  t.is(parsedBody['my_key_one'], 'my_value_one')
  t.is(parsedBody['my_key_two'], 'my_value_two')
})

test('should parse body with two properties and a file', t => {
  const parsedBody = MultipartFormData(
    {
      'Content-Type': 'Multipart/Form-Data; boundary=--MySpecialBoundary'
    },
    '--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_key_one"\r\n\r\nmy_value_one\r\n--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_key_two"\r\n\r\nmy_value_two\r\n--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_uploaded_file"; filename="README.md"\r\nContent-Type: text/markdown\r\n\r\n# simple multipart form data\r\n--MySpecialBoundary--'
  ).parse()

  t.is(parsedBody['my_key_one'], 'my_value_one')
  t.is(parsedBody['my_key_two'], 'my_value_two')
  t.deepEqual(parsedBody['my_uploaded_file'], [{
    filename: 'README.md',
    mimeType: 'text/markdown',
    data: Buffer.from('# simple multipart form data')
  }])
})

test('should parse body with longer properties and a (pseudo) binary file', t => {
  const parsedBody = MultipartFormData(
    {
      'Content-Type': 'Multipart/Form-Data; boundary=--MySpecialBoundary'
    },
    '--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_key_one"\r\n\r\nmy_value_one\r\n--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_key_two"\r\n\r\nmy_value_two\r\n--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_recaptcha_response"\r\n\r\n03AOLTBLRdf41VsFrrPKInPVLLDkfNqixBfytxuKILrLh8HSIqlE0s9Zx5WZ8Jqqw6NQH8OiBEMHvO-0v6WI_RtDxmwEDHN8AXHw_OwJFus-cbdGJ1_Qcfmf0m2WZckiLa3YJm_iHoldWs_V92YLKIamPMNkLFmggMWe-ieikUWdCPiIEaGZxFvgScANKjtWxhCoFkAMTa9tsw0oK2Q8mijB_6b0uLahIgA4LdawVORWXju3IVMOYraT2feFVPmEnsnvh9M_4QZjwiLNt9PO8O4c3e36X6Oz_RXtA1_fCx3uzSILfhgaIU31JmAPuiJe1HjPehQYhsGLIf0vx4c-8PN5K_EOu0lzNxVbiKtQkVFlp79bPI5V1M2MRVjSZssdTrQY7PPslxTJzSJQgAoyBF8hJm_hHNmVUr62fd2TaqPkAOwSL_1gAftwj3_BtESXAPiQWSPQZg7C1O\r\n--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_uploaded_file"; filename="image.png"\r\nContent-Type: image/png\r\n\r\n\t\0\n\r\r\n--MySpecialBoundary--'
  ).parse()

  t.is(parsedBody['my_key_one'], 'my_value_one')
  t.is(parsedBody['my_key_two'], 'my_value_two')
  t.is(parsedBody['my_recaptcha_response'], '03AOLTBLRdf41VsFrrPKInPVLLDkfNqixBfytxuKILrLh8HSIqlE0s9Zx5WZ8Jqqw6NQH8OiBEMHvO-0v6WI_RtDxmwEDHN8AXHw_OwJFus-cbdGJ1_Qcfmf0m2WZckiLa3YJm_iHoldWs_V92YLKIamPMNkLFmggMWe-ieikUWdCPiIEaGZxFvgScANKjtWxhCoFkAMTa9tsw0oK2Q8mijB_6b0uLahIgA4LdawVORWXju3IVMOYraT2feFVPmEnsnvh9M_4QZjwiLNt9PO8O4c3e36X6Oz_RXtA1_fCx3uzSILfhgaIU31JmAPuiJe1HjPehQYhsGLIf0vx4c-8PN5K_EOu0lzNxVbiKtQkVFlp79bPI5V1M2MRVjSZssdTrQY7PPslxTJzSJQgAoyBF8hJm_hHNmVUr62fd2TaqPkAOwSL_1gAftwj3_BtESXAPiQWSPQZg7C1O')
  t.deepEqual(parsedBody['my_uploaded_file'], [{
    filename: 'image.png',
    mimeType: 'image/png',
    data: Buffer.from('\t\0\n\r')
  }])
})

test('should parse body with two properties and two files in one property', t => {
  const parsedBody = MultipartFormData(
    {
      'Content-Type': 'Multipart/Form-Data; boundary=--MySpecialBoundary'
    },
    '--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_key_one"\r\n\r\nmy_value_one\r\n--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_key_two"\r\n\r\nmy_value_two\r\n--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_uploaded_file"; filename="README.md"\r\nContent-Type: text/markdown\r\n\r\n# simple multipart form data\r\n--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_uploaded_file"; filename="LICENSE.txt"\r\nContent-Type: text/plain\r\n\r\nApache License 2.0\r\n--MySpecialBoundary--'
  ).parse()

  t.is(parsedBody['my_key_one'], 'my_value_one')
  t.is(parsedBody['my_key_two'], 'my_value_two')
  t.deepEqual(parsedBody['my_uploaded_file'], [{
    filename: 'README.md',
    mimeType: 'text/markdown',
    data: Buffer.from('# simple multipart form data')
  }, {
    filename: 'LICENSE.txt',
    mimeType: 'text/plain',
    data: Buffer.from('Apache License 2.0')
  }])
})

test('should parse body with two properties and two files in two properties', t => {
  const parsedBody = MultipartFormData(
    {
      'Content-Type': 'Multipart/Form-Data; boundary=--MySpecialBoundary'
    },
    '--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_key_one"\r\n\r\nmy_value_one\r\n--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_key_two"\r\n\r\nmy_value_two\r\n--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_uploaded_readme"; filename="README.md"\r\nContent-Type: text/markdown\r\n\r\n# simple multipart form data\r\n--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_uploaded_license"; filename="LICENSE.txt"\r\nContent-Type: text/plain\r\n\r\nApache License 2.0\r\n--MySpecialBoundary--'
  ).parse()

  t.is(parsedBody['my_key_one'], 'my_value_one')
  t.is(parsedBody['my_key_two'], 'my_value_two')
  t.deepEqual(parsedBody['my_uploaded_readme'], [{
    filename: 'README.md',
    mimeType: 'text/markdown',
    data: Buffer.from('# simple multipart form data')
  }])
  t.deepEqual(parsedBody['my_uploaded_license'], [{
    filename: 'LICENSE.txt',
    mimeType: 'text/plain',
    data: Buffer.from('Apache License 2.0')
  }])
})

test('should create header/body with two properties and a file and parse it afterwards', t => {
  const formDataBuilder = MultipartFormDataBuilder()
  formDataBuilder.append('my_key_one', 'my_value_one')
  formDataBuilder.append('my_key_two', 'my_value_two')
  formDataBuilder.appendFile('my_upload_file', Buffer.from('abc'), 'my-filename.txt', 'text/plain')
  const formData = formDataBuilder.build()

  const parsedFormData = MultipartFormData(formData.headers, formData.body)
    .parse()

  t.deepEqual(
    parsedFormData,
    {
      my_key_one: 'my_value_one',
      my_key_two: 'my_value_two',
      my_upload_file: [
        {
          filename: 'my-filename.txt',
          data: Buffer.from('abc'),
          mimeType: 'text/plain'
        }
      ]
    }
  )
})

test('should not parse headers without content-type', t => {
  const formData = MultipartFormData(
    {},
    '--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_key_one"\r\n\r\nmy_value_one\r\n--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_key_two"\r\n\r\nmy_value_two\r\n--MySpecialBoundary--'
  )

  t.throws(() => { formData.parse() }, 'Content-Type missing in headers')
})

test('should not parse headers with incorrect content-type', t => {
  const formData = MultipartFormData(
    {
      'Content-Type': 'application/json'
    },
    '--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_key_one"\r\n\r\nmy_value_one\r\n--MySpecialBoundary\r\nContent-Disposition: form-data; name="my_key_two"\r\n\r\nmy_value_two\r\n--MySpecialBoundary--'
  )

  t.throws(() => { formData.parse() }, 'Unexpected Content-Type \'application/json\' (expecting: \'multipart/form-data\')')
})
