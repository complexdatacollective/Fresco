const PROTOCOL_EXTENSION = '.netcanvas' as const;
const APP_SCHEMA_VERSION = 7 as const;
const APP_SUPPORTED_SCHEMA_VERSIONS = [7] as const;
// If unconfigured, the app will shut down after 30 minutes (1800000 ms)
export const UNCONFIGURED_TIMEOUT = 1800000 as const;
