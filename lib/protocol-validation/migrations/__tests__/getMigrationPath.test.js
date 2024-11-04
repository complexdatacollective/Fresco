/* eslint-env jest */

import getMigrationPath from "../getMigrationPath";

/**
 * Migrations are run in the order that they are defined relative to one another
 * e.g. 1 -> 3, will run 1 -> 2 -> 3
 */

describe("getMigrationPath", () => {
  it.todo(
    "gets the correct migration path for a protocol with a missing migration",
  );
  // it("gets the correct migration path for a protocol", () => {
  //   const migrationPath = getMigrationPath(1, 4);

  //   expect(migrationPath.length).toBe(3);

  //   // Not implemented in bun yet: https://github.com/oven-sh/bun/issues/1529

  //   expect(migrationPath).toEqual(
  //     expect.arrayContaining([
  //       expect.objectContaining({ version: 2 }),
  //       expect.objectContaining({ version: 3 }),
  //       expect.objectContaining({ version: 4 }),
  //     ]),
  //   );
  // });
});
