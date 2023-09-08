import type { Auth as LuciaAuth } from './utils/auth';

declare module '@codaco/ui/*';

/// <reference types="lucia" />
declare namespace Lucia {
  type Auth = LuciaAuth;
  type DatabaseUserAttributes = {
    username: string;
  };
  type DatabaseSessionAttributes = {
    username: string;
  };
}
