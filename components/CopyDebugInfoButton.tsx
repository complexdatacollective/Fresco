'use client';

import { Check, ClipboardCopy } from 'lucide-react';
import { cx } from '~/utils/cva';
import { Button } from './ui/Button';
import { useToast } from './ui/use-toast';

export default function CopyDebugInfoButton({
  debugInfo,
  showToast = true,
  className,
}: {
  debugInfo: string;
  showToast?: boolean;
  className?: string;
}) {
  const { toast } = useToast();

  const copyDebugInfoToClipboard = async () => {
    await navigator.clipboard.writeText(debugInfo);

    if (showToast) {
      toast({
        icon: <Check />,
        title: 'Success',
        description: 'Debug information copied to clipboard',
        variant: 'success',
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
      variant="text"
    >
      <ClipboardCopy className="mr-2 h-4 w-4" />
      Copy Debug Info
    </Button>
  );
}
