'use client';

import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';

// Display options for dates: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat#using_options
export const dateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
};

function FormattedDate({
  date,
  options = dateOptions,
}: {
  date: string | number | Date;
  options?: Intl.DateTimeFormatOptions;
}) {
  const formattedDate = Intl.DateTimeFormat(
    navigator.languages as string[],
    options,
  ).format(new Date(date));

  return (
    <time dateTime={formattedDate} suppressHydrationWarning>
      {formattedDate}
    </time>
  );
}

export default withNoSSRWrapper(FormattedDate);
