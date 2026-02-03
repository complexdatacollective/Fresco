'use client';

import { useState, useEffect } from 'react';
import { Switch } from '~/components/ui/switch';

const OFFLINE_MODE_KEY = 'offlineModeEnabled';

export type OfflineModeSwitchProps = object &
  React.HTMLAttributes<HTMLDivElement>;

export function OfflineModeSwitch({
  className,
  ...props
}: OfflineModeSwitchProps) {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(OFFLINE_MODE_KEY);
    setEnabled(stored === 'true');
    setMounted(true);
  }, []);

  const handleChange = (checked: boolean) => {
    setEnabled(checked);
    localStorage.setItem(OFFLINE_MODE_KEY, checked.toString());
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className={className} {...props}>
      <Switch checked={enabled} onCheckedChange={handleChange} />
    </div>
  );
}
