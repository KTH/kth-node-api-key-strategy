/**
 * ApiKey Strategy.
 * Configure the keys to use in localSettings.js within secure: {}.
 * Configure: api_keys: [{name: 'NAME of client', apikey: 'THE API key', scope: ['Name of scope']}
 * Sample: api_keys: [{name: 'pontus', apikey: 'AAAA', scope: ['write']}, {name: 'ove', apikey: 'BBBB', scope: ['read']}, {name: 'jon', apikey: '1234', scope: ['write', 'read']}],
 * client "pontus" has a key with scope 'write', client "ove" has a key with scope 'read' and finally client "jon" has a key with scopes 'read' and 'write'
 */
var passport = require('passport')
var util = require('util')
var log = { debug: console.log,
  info: console.log,
  warn: console.log,
  error: console.log }

/**
 * Creates an instance of `Strategy` checking api keys.
 */
function Strategy (options, verify) {
  if (typeof options === 'function') {
    verify = options
    options = {}
  } else {
    if (options && options.log) {
      log = options.log
    }
  }
  if (!verify) {
    throw new Error('apikey authentication strategy requires a verify function')
  }

  passport.Strategy.call(this)

  this._apiKeyHeader = options.apiKeyHeader || 'api_key'
  this.name = 'apikey'
  this._verify = verify
  this._passReqToCallback = true
}

/**
 * Inherit from `passport.Strategy`.
 */
util.inherits(Strategy, passport.Strategy)

/**
 * Authenticate request.
 *
 * @param req The request to authenticate.
 * @param options Strategy-specific options.
 */
Strategy.prototype.authenticate = function (req, options) {
  options = options || {}
  var apikey = req.header(this._apiKeyHeader)
  if (!apikey) {
    apikey = req.query[ this._apiKeyHeader ] // swagger compatible
  }

  if (!apikey) {
    return this.fail(new BadRequestError('Missing API Key'))
  }

  var self = this
  /*
   * Verifies the user login add set error, fail or success depending on the result.
   */
  var verified = function (err, user, info) {
    if (err) {
      return self.error(err)
    }
    if (!user) {
      return self.fail(info)
    }
    self.success(user, info)
  }

  this._verify(req, apikey, verified)
}

/**
 * `BadRequestError` error.
 * @api public
 */
function BadRequestError (message) {
  this.name = 'BadRequestError'
  this.message = message
  this.stack = (new Error()).stack
}

// inherit from Error
BadRequestError.prototype = Object.create(Error.prototype)
BadRequestError.prototype.constructor = BadRequestError

function verifyApiKey (req, apikey, configuredApiKeys, done) {
  try {
    for (var i = 0; i < configuredApiKeys.length; i++) {
      var client = configuredApiKeys[ i ]
      if (client.apikey === apikey) {
        log.debug('Authenticate ' + client.name)
        for (var s = 0; s < client.scope.length; s++) {
          var assignedScope = client.scope[ s ]
          if (req.scope.indexOf(assignedScope) >= 0) {
            return done(null, client.name)
          }
        }
      }
    }

    return done(null, null, '401')
  } catch (err) {
    done(err)
  }
}

/**
 * Expose `Strategy`.
 * And verify function.
 */
module.exports.Strategy = Strategy
module.exports.verifyApiKey = verifyApiKey
