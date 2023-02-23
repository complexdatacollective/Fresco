import { Protocol } from '@codaco/shared-consts';
import version4 from './4.js';
import version5 from './5.js';
import version6 from './6.js';
import version7 from './7.js';
import version8 from './8.js';

/**
 * These must be in order!
 */

export type Migration = {
  version: number | "1.0.0";
  migration: (protocol: Protocol) => Protocol;
  notes?: string;
}

const migrations: Migration[] = [
  { version: '1.0.0', migration: (protocol: Protocol) => protocol },
  { version: 1, migration: (protocol: Protocol) => protocol },
  { version: 2, migration: (protocol: Protocol) => protocol },
  { version: 3, migration: (protocol: Protocol) => protocol },
  version4,
  version5,
  version6,
  version7,
  version8,
];

export default migrations;
