'use client';

import { useState, useEffect } from 'react';
import { Progress } from '~/components/ui/progress';
import Paragraph from '~/components/typography/Paragraph';

type StorageEstimate = {
  usage: number;
  quota: number;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export type StorageUsageProps = object & React.HTMLAttributes<HTMLDivElement>;

export function StorageUsage({ className, ...props }: StorageUsageProps) {
  const [storage, setStorage] = useState<StorageEstimate | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const getStorageEstimate = async () => {
      if (!navigator.storage?.estimate) {
        setIsSupported(false);
        return;
      }

      try {
        const estimate = await navigator.storage.estimate();
        setStorage({
          usage: estimate.usage ?? 0,
          quota: estimate.quota ?? 0,
        });
      } catch (error) {
        setIsSupported(false);
      }
    };

    void getStorageEstimate();
  }, []);

  if (!isSupported) {
    return (
      <div className={className} {...props}>
        <Paragraph>Storage information unavailable</Paragraph>
      </div>
    );
  }

  if (!storage) {
    return null;
  }

  const percentUsed =
    storage.quota > 0 ? (storage.usage / storage.quota) * 100 : 0;

  return (
    <div className={className} {...props}>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Storage Used</span>
          <span>
            {formatBytes(storage.usage)} / {formatBytes(storage.quota)}
          </span>
        </div>
        <Progress value={percentUsed} />
      </div>
    </div>
  );
}
