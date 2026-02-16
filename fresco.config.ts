export const PROTOCOL_EXTENSION = '.netcanvas';
export const APP_SUPPORTED_SCHEMA_VERSIONS = [7, 8];
export const MIN_ARCHITECT_VERSION_FOR_PREVIEW = '7.0.1';

// Analytics
export const POSTHOG_APP_NAME = 'Fresco';
export const POSTHOG_PROXY_HOST = 'ph-proxy.networkcanvas.com';
export const POSTHOG_API_KEY =
  'phc_OThPUolJumHmf142W78TKWtjoYYAxGlF0ZZmhcV7J3c';

// If unconfigured, the app will shut down after 2 hours (7200000 ms)
export const UNCONFIGURED_TIMEOUT = 7200000;

// Display options for dates: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat#using_options
export const dateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
};
