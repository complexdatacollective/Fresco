'use client';

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { Button } from '~/components/ui/Button';

type RecoveryCodesProps = {
  codes: string[];
};

export default function RecoveryCodes({ codes }: RecoveryCodesProps) {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const content = [
      'Fresco Recovery Codes',
      '=====================',
      '',
      'Save these codes in a safe place.',
      'Each code can only be used once.',
      '',
      ...codes,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fresco-recovery-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="warning">
        <AlertTitle>Save your recovery codes</AlertTitle>
        <AlertDescription>
          Save these recovery codes in a safe place. Each code can only be used
          once. If you lose access to your authenticator app, you can use these
          codes to sign in.
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-2 gap-2">
        {codes.map((code) => (
          <code
            key={code}
            className="bg-input font-monospace rounded px-3 py-2 text-center text-sm"
          >
            {code}
          </code>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleDownload}>
          Download as text
        </Button>
        <Button variant="outline" onClick={() => void handleCopy()}>
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </Button>
      </div>
    </div>
  );
}
