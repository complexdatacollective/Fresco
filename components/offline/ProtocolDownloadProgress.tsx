'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { IconButton } from '~/components/ui/Button';
import { Progress } from '~/components/ui/progress';
import type { DownloadProgress } from '~/lib/offline/assetDownloadManager';
import { cx } from '~/utils/cva';

export type ProtocolDownloadProgressProps = {
  progress: DownloadProgress;
  onCancel?: () => void;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function ProtocolDownloadProgress({
  progress,
  onCancel,
  className,
  ...props
}: ProtocolDownloadProgressProps) {
  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);
  const [lastBytes, setLastBytes] = useState(0);
  const [lastTime, setLastTime] = useState(Date.now());

  useEffect(() => {
    if (progress.status !== 'downloading') {
      setDownloadSpeed(null);
      return;
    }

    const now = Date.now();
    const timeDiff = (now - lastTime) / 1000;
    const bytesDiff = progress.downloadedBytes - lastBytes;

    if (timeDiff > 0 && bytesDiff > 0) {
      const speed = bytesDiff / timeDiff;
      setDownloadSpeed(speed);
      setLastBytes(progress.downloadedBytes);
      setLastTime(now);
    }
  }, [progress.downloadedBytes, progress.status, lastBytes, lastTime]);

  const percentage =
    progress.totalAssets > 0
      ? Math.round((progress.downloadedAssets / progress.totalAssets) * 100)
      : 0;

  return (
    <div
      className={cx('flex flex-col gap-2 rounded-lg border p-4', className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium">
            {progress.status === 'downloading' && 'Downloading protocol assets'}
            {progress.status === 'paused' && 'Download paused'}
            {progress.status === 'completed' && 'Download completed'}
            {progress.status === 'error' && 'Download failed'}
          </div>
          <div className="text-xs opacity-70">
            {progress.downloadedAssets} of {progress.totalAssets} assets
            {progress.totalBytes > 0 && (
              <> · {formatBytes(progress.downloadedBytes)}</>
            )}
            {downloadSpeed !== null && progress.status === 'downloading' && (
              <> · {formatBytes(downloadSpeed)}/s</>
            )}
          </div>
        </div>
        {onCancel && (
          <IconButton
            variant="text"
            size="sm"
            icon={<X className="size-4" />}
            onClick={onCancel}
            aria-label="Cancel download"
          />
        )}
      </div>

      <Progress value={percentage} className="w-full" />

      {progress.status === 'error' && progress.error && (
        <div className="text-destructive text-xs">{progress.error}</div>
      )}

      {progress.status === 'paused' && (
        <div className="text-xs opacity-70">
          Download paused. Restart to continue.
        </div>
      )}
    </div>
  );
}
