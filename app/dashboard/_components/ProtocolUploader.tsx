'use client';

import ProtocolImportPopover from '~/components/ProtocolImport/ProtocolImportPopover';
import { type ButtonProps } from '~/components/ui/Button';
import { useProtocolImport } from '~/hooks/useProtocolImport';

export default function ProtocolUploader({
  className,
  buttonVariant,
  buttonSize,
  buttonDisabled,
}: {
  className?: string;
  buttonVariant?: ButtonProps['variant'];
  buttonSize?: ButtonProps['size'];
  buttonDisabled?: boolean;
}) {
  const { importProtocols } = useProtocolImport();

  return (
    <ProtocolImportPopover
      onFilesAccepted={importProtocols}
      buttonVariant={buttonVariant}
      buttonSize={buttonSize}
      buttonDisabled={buttonDisabled}
      className={className}
    />
  );
}
