import React, { useState, useEffect, useMemo } from 'react';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';

type TimeAgoProps = {
  date: Date | string | number;
};

const TimeAgo: React.FC<TimeAgoProps> = ({ date: dateProp }) => {
  const date = useMemo(() => new Date(dateProp), [dateProp]);

  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    const calculateTimeAgo = () => {
      const now = new Date();
      const distance = now.getTime() - date.getTime();

      if (distance < 60000) {
        setTimeAgo('just now');
      } else if (distance < 3600000) {
        setTimeAgo(`${Math.floor(distance / 60000)} minutes ago`);
      } else if (distance < 86400000) {
        setTimeAgo(`${Math.floor(distance / 3600000)} hours ago`);
      } else if (distance < 604800000) {
        setTimeAgo(`${Math.floor(distance / 86400000)} days ago`);
      } else {
        // More than a week ago, fall back to Intl.DateTimeFormat
        setTimeAgo(new Intl.DateTimeFormat(navigator.language).format(date));
      }
    };

    calculateTimeAgo();

    // Update time ago every minute
    const interval = setInterval(calculateTimeAgo, 60000);

    return () => clearInterval(interval);
  }, [date]);

  return <span>{timeAgo}</span>;
};

export default withNoSSRWrapper(TimeAgo);
