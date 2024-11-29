import { describe, expect, it } from 'vitest';
import getMigrationPath from '../getMigrationPath';

/**
 * Migrations are run in the order that they are defined relative to one another
 * e.g. 1 -> 3, will run 1 -> 2 -> 3
 */

describe('getMigrationPath', () => {
  it('gets the correct migration path for a protocol', () => {
    const migrationPath = getMigrationPath(1, 4);

    expect(migrationPath.length).toBe(3);

    expect(migrationPath).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ version: 2 }),
        expect.objectContaining({ version: 3 }),
        expect.objectContaining({ version: 4 }),
      ]),
    );
  });
});
