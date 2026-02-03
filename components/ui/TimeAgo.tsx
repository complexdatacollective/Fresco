import React, { useEffect, useMemo, useState } from 'react';
import { dateOptions } from '~/fresco.config';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';

type TimeAgoProps = React.TimeHTMLAttributes<HTMLTimeElement> & {
  date: Date | string | number;
};

const TimeAgo: React.FC<TimeAgoProps> = ({ date: dateProp, ...props }) => {
  const date = useMemo(() => new Date(dateProp), [dateProp]);
  const isValidDate = !isNaN(date.getTime());
  const localisedDate = isValidDate
    ? new Intl.DateTimeFormat(navigator.language, dateOptions).format(date)
    : 'Unknown';

  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    if (!isValidDate) {
      setTimeAgo('Unknown');
      return;
    }

    const calculateTimeAgo = () => {
      const now = new Date();
      const distance = now.getTime() - date.getTime();

      if (distance < 60000) {
        setTimeAgo('just now');
      } else if (distance < 3600000) {
        const singleOrPlural =
          Math.floor(distance / 60000) === 1 ? 'minute' : 'minutes';
        setTimeAgo(`${Math.floor(distance / 60000)} ${singleOrPlural} ago`);
      } else if (distance < 86400000) {
        const singleOrPlural =
          Math.floor(distance / 3600000) === 1 ? 'hour' : 'hours';
        setTimeAgo(`${Math.floor(distance / 3600000)} ${singleOrPlural} ago`);
      } else if (distance < 604800000) {
        const singleOrPlural =
          Math.floor(distance / 86400000) === 1 ? 'day' : 'days';
        setTimeAgo(`${Math.floor(distance / 86400000)} ${singleOrPlural} ago`);
      } else {
        // More than a week ago, fall back to Intl.DateTimeFormat
        setTimeAgo(localisedDate);
      }
    };

    calculateTimeAgo();

    // Update time ago every minute
    const interval = setInterval(calculateTimeAgo, 60000);

    return () => clearInterval(interval);
  }, [date, localisedDate, isValidDate]);

  return (
    <time
      {...props}
      data-testid="time-ago"
      dateTime={localisedDate}
      title={localisedDate}
    >
      {timeAgo}
    </time>
  );
};

export default withNoSSRWrapper(TimeAgo);
