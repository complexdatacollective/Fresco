export const PROTOCOL_EXTENSION = '.netcanvas';
export const APP_SUPPORTED_SCHEMA_VERSIONS = [7, 8];

// Analytics
export const POSTHOG_APP_NAME = 'Fresco';
export const POSTHOG_PROXY_HOST = 'https://ph-relay.networkcanvas.com';
export const POSTHOG_API_KEY =
  'phc_OThPUolJumHmf142W78TKWtjoYYAxGlF0ZZmhcV7J3c';

// If unconfigured, the app will shut down after 2 hours (7200000 ms)
export const UNCONFIGURED_TIMEOUT = 7200000;

export const dateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
};
