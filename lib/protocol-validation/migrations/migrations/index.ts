import type { ProtocolMigration } from "../migrateProtocol";
import version4 from "./4";
import version5 from "./5";
import version6 from "./6";
import version7 from "./7";
import version8 from "./8";

/**
 * These must be in order
 */
export const migrations: ProtocolMigration[] = [
  { version: 1, migration: (protocol) => protocol },
  { version: 2, migration: (protocol) => protocol },
  { version: 3, migration: (protocol) => protocol },
  version4,
  version5,
  version6,
  version7,
  version8,
];
