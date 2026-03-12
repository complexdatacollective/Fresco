'use client';

import { FileDown } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button, type ButtonProps } from '~/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import ProtocolImportDropzone from './ProtocolImportDropzone';

type ProtocolImportPopoverProps = {
  onFilesAccepted: (files: File[]) => void;
  buttonVariant?: ButtonProps['variant'];
  buttonSize?: ButtonProps['size'];
  buttonDisabled?: boolean;
  className?: string;
};

export default function ProtocolImportPopover({
  onFilesAccepted,
  buttonVariant,
  buttonSize,
  buttonDisabled,
  className,
}: ProtocolImportPopoverProps) {
  const [open, setOpen] = useState(false);

  const handleFilesAccepted = useCallback(
    (files: File[]) => {
      setOpen(false);
      onFilesAccepted(files);
    },
    [onFilesAccepted],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={buttonDisabled}
          variant={buttonVariant}
          size={buttonSize}
          className={className}
          icon={<FileDown />}
        >
          Import protocols
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-full max-w-md">
        <ProtocolImportDropzone onFilesAccepted={handleFilesAccepted} />
      </PopoverContent>
    </Popover>
  );
}
