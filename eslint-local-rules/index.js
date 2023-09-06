/* eslint-disable @typescript-eslint/no-var-requires */
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
  },
});

module.exports = require('./rules').default;
