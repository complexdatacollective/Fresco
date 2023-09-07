import type { Auth as LuciaAuth } from './utils/auth';

/// <reference types="lucia" />
declare namespace Lucia {
  type Auth = LuciaAuth;
  type DatabaseUserAttributes = {
    username: string;
  };
  type DatabaseSessionAttributes = {};
}
