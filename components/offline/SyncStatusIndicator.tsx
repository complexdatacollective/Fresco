'use client';

import { AlertCircle, Check, Loader2 } from 'lucide-react';
import useSyncStatus from '~/hooks/useSyncStatus';
import { cx } from '~/utils/cva';

export type SyncStatusIndicatorProps = {
  className?: string;
};

export function SyncStatusIndicator({ className }: SyncStatusIndicatorProps) {
  const { pendingSyncs, conflicts, isInitialized } = useSyncStatus();

  if (!isInitialized) {
    return null;
  }

  if (conflicts > 0) {
    return (
      <div
        className={cx(
          'text-destructive flex items-center gap-2 text-sm',
          className,
        )}
        aria-label={`${conflicts} sync conflict${conflicts === 1 ? '' : 's'}`}
      >
        <AlertCircle className="size-4" />
        <span className="laptop:inline hidden">
          {conflicts} conflict{conflicts === 1 ? '' : 's'}
        </span>
      </div>
    );
  }

  if (pendingSyncs > 0) {
    return (
      <div
        className={cx(
          'text-warning flex items-center gap-2 text-sm',
          className,
        )}
        aria-label={`${pendingSyncs} pending sync${pendingSyncs === 1 ? '' : 's'}`}
      >
        <div className="relative">
          <Loader2 className="size-4 animate-spin" />
          {pendingSyncs > 1 && (
            <span className="bg-warning text-background absolute -top-1 -right-1 flex size-3 items-center justify-center rounded-full text-[8px] font-bold">
              {pendingSyncs}
            </span>
          )}
        </div>
        <span className="laptop:inline hidden">Syncing...</span>
      </div>
    );
  }

  return (
    <div
      className={cx('text-success flex items-center gap-2 text-sm', className)}
      aria-label="All synced"
    >
      <Check className="size-4" />
      <span className="laptop:inline hidden">Synced</span>
    </div>
  );
}
