/* eslint-disable @typescript-eslint/consistent-type-imports */
/// <reference types="lucia" />
declare namespace Lucia {
  type Auth = import('./utils/auth').Auth;
  interface DatabaseUserAttributes {
    username: string;
  }
  // type DatabaseSessionAttributes = {};
}
