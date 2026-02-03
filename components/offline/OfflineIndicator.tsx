'use client';

import { WifiOff } from 'lucide-react';
import { Badge } from '~/components/ui/badge';
import useNetworkStatus from '~/hooks/useNetworkStatus';
import { cx } from '~/utils/cva';

type OfflineIndicatorProps = {
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export const OfflineIndicator = ({
  className,
  ...props
}: OfflineIndicatorProps) => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className={cx('fixed right-4 bottom-4 z-50', className)} {...props}>
      <Badge variant="secondary" className="gap-2 px-3 py-2 shadow-lg">
        <WifiOff className="h-4 w-4" />
        <span>Offline Mode</span>
      </Badge>
    </div>
  );
};
