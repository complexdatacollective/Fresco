'use client';

import { cn } from '~/utils/shadcn';
import { useToast } from './ui/use-toast';
import { ClipboardCopy } from 'lucide-react';
import { Button } from './ui/Button';

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
    console.log('writing', debugInfo);
    await navigator.clipboard.writeText(debugInfo);

    if (showToast) {
      toast({
        title: 'Success',
        description: 'Debug information copied to clipboard',
        variant: 'success',
        duration: 3000,
      });
    }
  };

  return (
    <Button
      onClick={copyDebugInfoToClipboard}
      // variant="ghost"
      className={cn(
        'bg-transparent h-auto w-auto rounded-md border border-platinum-dark p-1 text-primary/70 transition-all',
        'hover:bg-transparent hover:text-primary/100',
        className,
      )}
      title="Copy to clipboard"
    >
      <ClipboardCopy className="h-4 w-4" />
    </Button>
  );
}
