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

export function MultipartFormData (headers, body) {
  function parseBoundary (contentType) {
    const contentTypePattern = /multipart\/form-data; boundary=-[-]+(.+)/gi
    const match = contentTypePattern.exec(contentType)

    return match[1]
  }

  function parsePropertyLines (body, boundary) {
    const bodyPattern = new RegExp(`(-[-]+${boundary}\r\nContent-Disposition: form-data; name=".+"\r\n\r\n.*\r\n)`, 'g')
    let matched = bodyPattern.exec(body)
    const bodyLines = []

    while (matched) {
      const bodyLine = matched[1]
      bodyLines.push(bodyLine)
      matched = bodyPattern.exec(body)
    }

    return bodyLines
  }

  function parseFileLines (body, boundary) {
    const bodyPattern = new RegExp(`(-[-]+${boundary}\r\nContent-Disposition: form-data; name=".+"; filename=".+"\r\nContent-Type: .+\r\n\r\n(?:.|\\n)*\r\n)`, 'g')
    let matched = bodyPattern.exec(body)
    const bodyLines = []

    while (matched) {
      const bodyLine = matched[1]
      bodyLines.push(bodyLine)
      matched = bodyPattern.exec(body)
    }

    return bodyLines
  }

  function matchPropertyLine (boundary, line) {
    const linePattern = new RegExp(`-[-]+${boundary}\r\nContent-Disposition: form-data; name="(.+)"\r\n\r\n(.*)\r\n`, 'g')
    return linePattern.exec(line)
  }

  function matchFileLine (boundary, line) {
    const linePattern = new RegExp(`(-[-]+${boundary}\r\nContent-Disposition: form-data; name="(.+)"; filename="(.+)"\r\nContent-Type: (.+)\r\n\r\n((?:.|\\n)*)\r\n)`, 'g')
    return linePattern.exec(line)
  }

  function parseProperties (boundary, body) {
    const bodyLines = parsePropertyLines(body, boundary)

    return bodyLines.map(line => matchPropertyLine(boundary, line))
      .filter(match => !!match)
      .map(match => ({ [match[1]]: match[2] }))
      .reduce((keyValuePair, obj) => ({ ...obj, ...keyValuePair }))
  }

  function parseFiles (boundary, body) {
    const fileLines = parseFileLines(body, boundary)

    const files = {}

    fileLines.map(line => matchFileLine(boundary, line))
      .filter(match => !!match)
      .forEach(match => {
        const property = match[2]
        const file = {
          filename: match[3],
          mimeType: match[4],
          data: Buffer.from(match[5])
        }

        files[property] ? files[property].push(file) : files[property] = [file]
      })

    return files
  }

  function parse () {
    const contentType = headers['Content-Type'] || headers['content-type']
    const boundary = parseBoundary(contentType)

    const properties = parseProperties(boundary, body)
    const files = parseFiles(boundary, body)

    return { ...properties, ...files }
  }

  return {
    parse
  }
}
