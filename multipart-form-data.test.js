import test from 'ava'
import { MultipartFormData } from './multipart-form-data'

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
