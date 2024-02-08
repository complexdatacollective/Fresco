import React, { useState, useEffect, useMemo } from 'react';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import { dateOptions } from './FormattedDate';

type TimeAgoProps = {
  date: Date | string | number;
};

const TimeAgo: React.FC<TimeAgoProps> = ({ date: dateProp }) => {
  const date = useMemo(() => new Date(dateProp), [dateProp]);
  const localisedDate = new Intl.DateTimeFormat(
    navigator.language,
    dateOptions,
  ).format(date);

  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
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
  }, [date, localisedDate]);

  return (
    <time dateTime={localisedDate} title={localisedDate}>
      {timeAgo}
    </time>
  );
};

export default withNoSSRWrapper(TimeAgo);
