export const PROTOCOL_EXTENSION = '.netcanvas';
export const APP_SUPPORTED_SCHEMA_VERSIONS = [7];
// If unconfigured, the app will shut down after 30 minutes (1800000 ms)
export const UNCONFIGURED_TIMEOUT = 1800000;

// Display options for dates: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat#using_options
export const dateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
};
