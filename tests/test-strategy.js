/* eslint-env mocha */

const expect = require('chai').expect

// const Strategy = require('../index').Strategy
const verifyApiKey = require('../index').verifyApiKey

describe('Testing API key', function () {
  it('should return 401 with no arguments', function () {
    let err = verifyApiKey({}, {}, {}, (error, user, info) => error || info)
    expect(err).to.be.equal('401')
  })
})
