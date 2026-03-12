'use client';

import { Upload } from 'lucide-react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import { PROTOCOL_EXTENSION } from '~/fresco.config';
import { cx } from '~/utils/cva';

type ProtocolImportDropzoneProps = {
  onFilesAccepted: (files: File[]) => void;
  className?: string;
};

export default function ProtocolImportDropzone({
  onFilesAccepted,
  className,
}: ProtocolImportDropzoneProps) {
  const handleDrop = useCallback(
    (files: File[]) => {
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
    <div
      {...getRootProps()}
      className={cx(
        'flex flex-col items-center gap-3 p-6 text-center',
        'rounded-lg border-2 border-dashed transition-colors',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-surface-contrast/20',
        className,
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
  );
}
