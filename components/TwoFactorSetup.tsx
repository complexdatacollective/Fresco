'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import { enableTotp, verifyTotpSetup } from '~/actions/totp';
import RecoveryCodes from '~/components/RecoveryCodes';
import TwoFactorVerify from '~/components/TwoFactorVerify';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { Button } from '~/components/ui/Button';
import Dialog from '~/lib/dialogs/Dialog';
import { cx } from '~/utils/cva';

type TwoFactorSetupProps = {
  open: boolean;
  onClose: () => void;
  onSetupComplete?: () => void;
  userCount: number;
};

type SetupData = {
  secret: string;
  qrCodeDataUrl: string;
};

export default function TwoFactorSetup({
  open,
  onClose,
  onSetupComplete,
  userCount,
}: TwoFactorSetupProps) {
  const [step, setStep] = useState<'generate' | 'verify' | 'recovery'>(
    'generate',
  );
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);
  const setupCompleted = useRef(false);

  const handleOpen = async () => {
    setIsLoading(true);
    const result = await enableTotp();
    setIsLoading(false);

    if (result.data) {
      setSetupData(result.data);
    }
  };

  const handleVerify = async (code: string) => {
    setIsVerifying(true);
    setVerifyError(null);

    const result = await verifyTotpSetup({ code });

    setIsVerifying(false);

    if (result.error) {
      setVerifyError(result.error);
      return;
    }

    if (result.data) {
      setRecoveryCodes(result.data.recoveryCodes);
      setStep('recovery');
      setupCompleted.current = true;
    }
  };

  const handleClose = () => {
    if (setupCompleted.current) {
      onSetupComplete?.();
      setupCompleted.current = false;
    }
    setStep('generate');
    setSetupData(null);
    setRecoveryCodes([]);
    setVerifyError(null);
    setSecretCopied(false);
    onClose();
  };

  const handleCopySecret = async () => {
    if (!setupData) return;
    await navigator.clipboard.writeText(setupData.secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  useEffect(() => {
    if (open && !setupData && !isLoading && step === 'generate') {
      void handleOpen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  let title: string;
  let description: ReactNode;
  let footer: ReactNode;

  if (step === 'recovery') {
    title = 'Save Recovery Codes';
    description = undefined;
    footer = (
      <Button color="primary" onClick={handleClose}>
        I&apos;ve saved my recovery codes
      </Button>
    );
  } else {
    title = 'Set Up Two-Factor Authentication';
    description =
      'Scan the QR code with your authenticator app, then enter the code to verify.';
    footer = undefined;
  }

  return (
    <Dialog
      open={open}
      closeDialog={handleClose}
      title={title}
      description={description}
      footer={footer}
    >
      {step === 'generate' && (
        <div className="flex flex-col gap-6">
          {userCount === 1 && (
            <Alert variant="warning">
              <AlertTitle>Single account warning</AlertTitle>
              <AlertDescription>
                You are the only user account. If you lose access to your
                authenticator app and recovery codes, there will be no way to
                recover your account. Consider creating a second user account
                first.
              </AlertDescription>
            </Alert>
          )}
          {isLoading && (
            <p className="py-8 text-center text-current/70">
              Generating secret...
            </p>
          )}
          {setupData && (
            <>
              <div className="flex justify-center">
                <img
                  src={setupData.qrCodeDataUrl}
                  alt="QR code for authenticator app"
                  width={200}
                  height={200}
                />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-current/70">
                  Can&apos;t scan the QR code? Enter this secret manually:
                </p>
                <div className="flex items-center gap-2">
                  <code
                    className={cx(
                      'bg-input font-monospace flex-1 rounded px-3 py-2 text-sm',
                      'break-all select-all',
                    )}
                  >
                    {setupData.secret}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleCopySecret()}
                  >
                    {secretCopied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
              <TwoFactorVerify
                onVerify={handleVerify}
                error={verifyError}
                isSubmitting={isVerifying}
              />
            </>
          )}
        </div>
      )}
      {step === 'recovery' && <RecoveryCodes codes={recoveryCodes} />}
    </Dialog>
  );
}
