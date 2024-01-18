// Display options for dates: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat#using_options
export const dateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
};

// Utility to help with hydration errors caused by SSR and date formatting
export const conditionallyFormatDate = (date: Date, locales?: string[]) => {
  if (locales) {
    return new Intl.DateTimeFormat(locales, dateOptions).format(new Date(date));
  }
  return null;
};
