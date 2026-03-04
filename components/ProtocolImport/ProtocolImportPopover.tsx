'use client';

import { FileDown, Upload } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button, type ButtonProps } from '~/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { PROTOCOL_EXTENSION } from '~/fresco.config';
import { cx } from '~/utils/cva';

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

  const handleDrop = useCallback(
    (files: File[]) => {
      setOpen(false);
      onFilesAccepted(files);
    },
    [onFilesAccepted],
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openFileDialog,
  } = useDropzone({
    onDropAccepted: handleDrop,
    accept: {
      'application/octect-stream': [PROTOCOL_EXTENSION],
      'application/zip': [PROTOCOL_EXTENSION],
    },
    noClick: true,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={buttonDisabled}
          variant={buttonVariant}
          size={buttonSize}
          className={className}
        >
          <FileDown className="inline-block size-4" />
          Import protocols
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div
          {...getRootProps()}
          className={cx(
            'flex flex-col items-center gap-3 p-6 text-center',
            'rounded-lg border-2 border-dashed transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-surface-contrast/20',
          )}
        >
          <input {...getInputProps()} />
          <div
            className={cx(
              'flex size-12 items-center justify-center rounded-full',
              isDragActive ? 'bg-primary/10' : 'bg-surface-contrast/5',
            )}
          >
            <Upload
              className={cx(
                'size-6',
                isDragActive ? 'text-primary' : 'text-surface-contrast/40',
              )}
            />
          </div>
          <div>
            <Heading level="h4" margin="none">
              {isDragActive ? 'Drop files here' : 'Import protocols'}
            </Heading>
            <Paragraph margin="none" emphasis="muted" className="mt-1 text-sm">
              Drag & drop <code>{PROTOCOL_EXTENSION}</code> files here
            </Paragraph>
          </div>
          <Button variant="outline" size="sm" onClick={openFileDialog}>
            Browse files
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
