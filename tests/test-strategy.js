/* eslint-env mocha */

const expect = require('chai').expect
const httpMocks = require('node-mocks-http')

const Strategy = require('../index').Strategy
const verifyApiKey = require('../index').verifyApiKey

const cb = function (error, user, info) {
  if (error) throw error
  return user || info
}

const configuredApiKeys = [
  { name: 'kalle', apikey: '1234', scope: ['read'] },
  { name: 'lisa', apikey: 'asdf' }
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
      expect(failingStrategy).to.be.undefined
    } catch (err) {
      expect(err).to.be.not.undefined
    }
  })
  it('should accept a logger function', function () {
    let succeedingStrategy = new Strategy({
      log: {
        debug: () => {}
      }
    }, verify)
    expect(succeedingStrategy).to.be.not.undefined
  })
  it('should accept another apiKeyHeader', function () {
    let succeedingStrategy = new Strategy({
      log: {
        debug: () => {}
      },
      apiKeyHeader: 'myHeader'
    }, verify)
    expect(succeedingStrategy._apiKeyHeader).to.be.equal('myHeader')
  })
  it('should accept a verify function as options param', function () {
    let succeedingStrategy = new Strategy(verify)
    expect(succeedingStrategy).to.be.not.undefined
  })
})

describe('Testing verifyApiKey', function () {
  it('should return 401 with no arguments', function () {
    let err = verifyApiKey({}, {}, {}, cb)
    expect(err).to.be.equal('401')
  })
  it('should return an authenticated user', function () {
    const req = httpMocks.createRequest()
    req.scope = ['read']

    let user = verifyApiKey(req, '1234', configuredApiKeys, cb)
    expect(user).to.be.equal('kalle')
  })
  it('should not allow a read user to write', function () {
    const req = httpMocks.createRequest()
    req.scope = ['write']

    let user = verifyApiKey(req, '1234', configuredApiKeys, cb)
    expect(user).to.be.equal('401')
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
      headers: {'api_key': '1234'}
    })
    req.scope = ['read']

    strategy.authenticate(req)
    expect(result).to.be.equal('kalle')
    expect(error).to.be.undefined
    expect(fail).to.be.undefined
  })

  it('should allow an authenticated user via query parameters', function () {
    const req = httpMocks.createRequest({
      query: {'api_key': '1234'}
    })
    req.scope = ['read']

    strategy.authenticate(req)
    expect(result).to.be.equal('kalle')
    expect(error).to.be.undefined
    expect(fail).to.be.undefined
  })

  it('should fail for an unauthenticated user', function () {
    const req = httpMocks.createRequest({})
    req.scope = ['read']
    strategy.authenticate(req)
    expect(result).to.be.undefined
    expect(error).to.be.undefined
    expect(fail.message).to.be.equal('Missing API Key')
  })

  it('should fail for a bad api key', function () {
    const req = httpMocks.createRequest({
      headers: {'api_key': 'bad_api_key'}
    })
    req.scope = ['read']
    strategy.authenticate(req)
    expect(result).to.be.undefined
    expect(error).to.be.undefined
    expect(fail).to.be.equal('401')
  })
  it('should set errors from verify with error function', function () {
    const req = httpMocks.createRequest({
      headers: {'api_key': 'asdf'}
    })
    strategy.authenticate(req)
    expect(error).to.be.not.undefined
  })
})
