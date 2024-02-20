export const PROTOCOL_EXTENSION = '.netcanvas' as const;
export const APP_SCHEMA_VERSION = 7 as const;
export const APP_SUPPORTED_SCHEMA_VERSIONS = [7] as const;
// If unconfigured, the app will shut down after 15 minutes (900000 ms)
export const UNCONFIGURED_TIMEOUT = 900000 as const;
