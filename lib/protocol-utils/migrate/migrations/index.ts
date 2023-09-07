import version4 from './4';
import version5 from './5';
import version6 from './6';
import version7 from './7';
import version8 from './8';

/**
 * These must be in order!
 */
const migrations = [
  { version: '1.0.0', migration: (protocol) => protocol },
  { version: 1, migration: (protocol) => protocol },
  { version: 2, migration: (protocol) => protocol },
  { version: 3, migration: (protocol) => protocol },
  version4,
  version5,
  version6,
  version7,
  version8,
];

export default migrations;
