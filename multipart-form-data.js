export function MultipartFormDataBuilder () {
  const values = []
  const files = []

  function build () {
    const crlf = '\r\n'
    const boundaryKey = createBoundaryKey()
    const boundary = `--${boundaryKey}`
    const delimiter = `${crlf}--${boundary}`
    const closeDelimiter = `${delimiter}--`

    function buildBody () {
      let multipartBody = Buffer.from('')

      values.forEach(value => {
        multipartBody = Buffer.concat([
          multipartBody,
          Buffer.from(`${delimiter}${crlf}Content-Disposition: form-data; name="${value.name}";${crlf}`),
          Buffer.from(`${crlf}${value.value}`)
        ])
      })

      files.forEach(value => {
        multipartBody = Buffer.concat([
          multipartBody,
          Buffer.from(`${delimiter}${crlf}Content-Disposition: form-data; name="${value.name}"; filename="${value.filename}"${crlf}Content-Type: ${value.contentType}${crlf}${crlf}`),
          value.data
        ])
      })

      multipartBody = Buffer.concat([
        multipartBody,
        Buffer.from(closeDelimiter)
      ])

      return multipartBody
    }

    const body = buildBody()

    return {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      },
      body
    }
  }

  function append (name, value) {
    values.push({ name, value })
  }

  function appendFile (name, data, filename, contentType) {
    files.push({ name, data, filename, contentType })
  }

  function createBoundaryKey () {
    function randomInteger (min, max) {
      return Math.floor((Math.random() * (max - min + 1)) + min)
    }

    return randomInteger(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)
  }

  return {
    build,
    append,
    appendFile
  }
}
