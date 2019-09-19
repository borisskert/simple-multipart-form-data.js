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
          Buffer.from(`${delimiter}${crlf}Content-Disposition: form-data; name="${value.name}"${crlf}`),
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

export function MultipartFormData (headers, rawBody) {
  function parseBoundary (contentType) {
    const contentTypePattern = /multipart\/form-data; boundary=-[-]+(.+)/gi
    const match = contentTypePattern.exec(contentType)

    if (!match) {
      throw new Error(`Unexpected Content-Type '${contentType}' (expecting: 'multipart/form-data')`)
    }

    return match[1]
  }

  function splitLines (body, boundary) {
    return body.split(new RegExp(`-[-]+${boundary}`, 'g'))
      .filter(line => line !== '--')
  }

  function parsePropertyLines (lines) {
    return lines
      .map(line => new RegExp(`^\r\nContent-Disposition: form-data; name="(.+)"\r\n\r\n(.*)\r\n$`, 'g').exec(line))
      .filter(match => !!match)
      .map(match => ({ [match[1]]: match[2] }))
      .reduce((keyValuePair, obj) => ({ ...obj, ...keyValuePair }), {})
  }

  function parseFileLines (lines) {
    const files = {}

    lines
      .map(line => new RegExp(`^\r\nContent-Disposition: form-data; name="(.+)"; filename="(.+)"\r\nContent-Type: (.+)\r\n\r\n((?:.)*)\r\n$`, 'gsmu').exec(line))
      .filter(match => !!match)
      .forEach(match => {
        const property = match[1]
        const file = {
          filename: match[2],
          mimeType: match[3],
          data: Buffer.from(match[4])
        }

        files[property] ? files[property].push(file) : files[property] = [file]
      })

    return files
  }

  function parse () {
    const contentType = headers['Content-Type'] || headers['content-type']

    if (!contentType) {
      throw new Error('Content-Type missing in headers')
    }

    const boundary = parseBoundary(contentType)

    const body = rawBody.toString()
    const lines = splitLines(body, boundary)
    const properties = parsePropertyLines(lines)
    const files = parseFileLines(lines)

    return { ...properties, ...files }
  }

  return {
    parse
  }
}
