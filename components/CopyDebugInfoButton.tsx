'use client';

import { ClipboardCopy } from 'lucide-react';
import { cx } from '~/utils/cva';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';

export default function CopyDebugInfoButton({
  debugInfo,
  showToast = true,
  className,
}: {
  debugInfo: string;
  showToast?: boolean;
  className?: string;
}) {
  const { add } = useToast();

  const copyDebugInfoToClipboard = async () => {
    await navigator.clipboard.writeText(debugInfo);

    if (showToast) {
      add({
        title: 'Debug information copied to clipboard',
        type: 'success',
      });
    }
  };

  return (
    <Button
      onClick={copyDebugInfoToClipboard}
      className={cx(
        // 'h-auto w-auto rounded border border-platinum-dark bg-transparent p-1 text-primary/70 transition-all',
        // 'hover:bg-transparent hover:text-primary/100',
        className,
      )}
      title="Copy to clipboard"
      color="primary"
      icon={<ClipboardCopy />}
    >
      Copy Debug Info
    </Button>
  );
}
