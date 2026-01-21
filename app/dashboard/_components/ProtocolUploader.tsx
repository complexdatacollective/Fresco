'use client';

import { FileDown, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button, type ButtonProps } from '~/components/ui/Button';
import { PROTOCOL_EXTENSION } from '~/fresco.config';
import { useProtocolImport } from '~/hooks/useProtocolImport';
import { useProtocolImportStore } from '~/lib/protocol-import/useProtocolImportStore';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import { cx } from '~/utils/cva';

function ProtocolUploader({
  className,
  buttonVariant,
  buttonSize,
  hideCancelButton,
  buttonDisabled,
}: {
  className?: string;
  buttonVariant?: ButtonProps['variant'];
  buttonSize?: ButtonProps['size'];
  hideCancelButton?: boolean;
  buttonDisabled?: boolean;
}) {
  const { importProtocols, cancelAllJobs } = useProtocolImport();
  const hasActiveJobs = useProtocolImportStore((s) => s.hasActiveJobs());

  const { getInputProps, open } = useDropzone({
    noClick: true,
    onDropAccepted: importProtocols,
    accept: {
      'application/octect-stream': [PROTOCOL_EXTENSION],
      'application/zip': [PROTOCOL_EXTENSION],
    },
  });

  return (
    <>
      <Button
        disabled={buttonDisabled}
        onClick={open}
        variant={buttonVariant}
        size={buttonSize}
        className={cx(
          hasActiveJobs &&
            cx(
              'from-cyber-grape via-neon-coral to-cyber-grape bg-linear-to-r text-white',
              'animate-background-gradient pointer-events-none cursor-wait bg-[length:400%]',
            ),
          className,
        )}
      >
        {hasActiveJobs ? (
          <Loader2 className="inline-block h-4 w-4 animate-spin" />
        ) : (
          <FileDown className="inline-block h-4 w-4" />
        )}
        <input {...getInputProps()} />
        Import protocols
      </Button>
      {!hideCancelButton && hasActiveJobs && (
        <Button onClick={cancelAllJobs}>Cancel all</Button>
      )}
    </>
  );
}

export default withNoSSRWrapper(ProtocolUploader);
