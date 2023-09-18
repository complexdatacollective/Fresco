/// <reference types="lucia" />
declare namespace Lucia {
  type Auth = import('./utils/auth').Auth;
  type DatabaseUserAttributes = {};
  type DatabaseSessionAttributes = {};
}

declare module '@codaco/ui/*';
