const httpMocks = require('node-mocks-http')

const Strategy = require('../index').Strategy
const verifyApiKey = require('../index').verifyApiKey

const cb = function (error, user, info) {
  if (error) throw error
  return user || info
}

const configuredApiKeys = [
  { name: 'kalle', apikey: '1234', scope: ['read'] },
  { name: 'lisa', apikey: 'asdf' },
]
const verify = (req, apikey, done) => {
  verifyApiKey(req, apikey, configuredApiKeys, done)
}

const strategy = new Strategy({}, verify)

let result
let error
let fail

strategy.success = function (user, info) {
  result = user
}

strategy.error = function (err) {
  error = err
}

strategy.fail = function (reason) {
  fail = reason
}

describe('Creating strategies', function () {
  it('should require a verify function', function () {
    try {
      let failingStrategy = new Strategy()
      expect(failingStrategy).toBeUndefined()
    } catch (err) {
      expect(err).toBeDefined()
    }
  })
  it('should accept a logger function', function () {
    let succeedingStrategy = new Strategy(
      {
        log: {
          debug: () => {},
        },
      },
      verify
    )
    expect(succeedingStrategy).toBeDefined()
  })
  it('should accept another apiKeyHeader', function () {
    let succeedingStrategy = new Strategy(
      {
        log: {
          debug: () => {},
        },
        apiKeyHeader: 'myHeader',
      },
      verify
    )
    expect(succeedingStrategy._apiKeyHeader).toBe('myHeader')
  })
  it('should accept a verify function as options param', function () {
    let succeedingStrategy = new Strategy(verify)
    expect(succeedingStrategy).toBeDefined()
  })
})

describe('Testing verifyApiKey', function () {
  it('should return 401 with no arguments', function () {
    let err = verifyApiKey({}, {}, {}, cb)
    expect(err).toBe('401')
  })
  it('should return an authenticated user', function () {
    const req = httpMocks.createRequest()
    req.scope = ['read']

    let user = verifyApiKey(req, '1234', configuredApiKeys, cb)
    expect(user).toBe('kalle')
  })
  it('should not allow a read user to write', function () {
    const req = httpMocks.createRequest()
    req.scope = ['write']

    let user = verifyApiKey(req, '1234', configuredApiKeys, cb)
    expect(user).toBe('401')
  })
})

describe('Testing Strategy', function () {
  beforeEach(function () {
    result = undefined
    error = undefined
    fail = undefined
  })

  it('should allow an authenticated user via headers', function () {
    const req = httpMocks.createRequest({
      headers: { api_key: '1234' },
    })
    req.scope = ['read']

    strategy.authenticate(req)
    expect(result).toBe('kalle')
    expect(error).toBeUndefined()
    expect(fail).toBeUndefined()
  })

  it('should allow an authenticated user via query parameters', function () {
    const req = httpMocks.createRequest({
      query: { api_key: '1234' },
    })
    req.scope = ['read']

    strategy.authenticate(req)
    expect(result).toBeUndefined()
    expect(error).toBeUndefined()
    console.log(fail.toString())
    expect(fail.message).toBe('Missing API Key')
  })

  it('should fail for an unauthenticated user', function () {
    const req = httpMocks.createRequest({})
    req.scope = ['read']
    strategy.authenticate(req)
    expect(result).toBeUndefined()
    expect(error).toBeUndefined()
    expect(fail.message).toBe('Missing API Key')
  })

  it('should fail for a bad api key', function () {
    const req = httpMocks.createRequest({
      headers: { api_key: 'bad_api_key' },
    })
    req.scope = ['read']
    strategy.authenticate(req)
    expect(result).toBeUndefined()
    expect(error).toBeUndefined()
    expect(fail).toBe('401')
  })
  it('should set errors from verify with error function', function () {
    const req = httpMocks.createRequest({
      headers: { api_key: 'asdf' },
    })
    strategy.authenticate(req)
    expect(error).toBeDefined()
  })
})
