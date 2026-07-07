const kthConfig = require('@kth/eslint-config-kth')

module.exports = [
  ...kthConfig,
  {
    ignores: ['node_modules/**'],
  },
]
