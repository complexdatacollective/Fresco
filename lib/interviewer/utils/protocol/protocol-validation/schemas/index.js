const version_1 = require('./1.js');
const version_2 = require('./2.js');
const version_3 = require('./3.js');
const version_4 = require('./4.js');
const version_5 = require('./5.js');
const version_6 = require('./6.js');
const version_7 = require('./7.js');
const version_8 = require('./8.js');

const versions = [
  { version: 1, validator: version_1 },
  { version: 2, validator: version_2 },
  { version: 3, validator: version_3 },
  { version: 4, validator: version_4 },
  { version: 5, validator: version_5 },
  { version: 6, validator: version_6 },
  { version: 7, validator: version_7 },
  { version: 8, validator: version_8 },
];

module.exports = versions;

