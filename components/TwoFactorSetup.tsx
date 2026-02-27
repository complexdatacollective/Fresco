'use client';

import { useCallback, useEffect, useState } from 'react';
import { enableTotp, verifyTotpSetup } from '~/actions/totp';
import RecoveryCodes from '~/components/RecoveryCodes';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import useDialog from '~/lib/dialogs/useDialog';
import { useWizard } from '~/lib/dialogs/useWizard';
import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import InputField from '~/lib/form/components/fields/InputField';
import SegmentedCodeField from '~/lib/form/components/fields/SegmentedCodeField';
import { cx } from '~/utils/cva';
import { surfaceSpacingVariants } from './layout/Surface';
import Spinner from './Spinner';
import Paragraph from './typography/Paragraph';
import Button from './ui/Button';

type SetupData = {
  secret: string;
  qrCodeDataUrl: string;
};

function QRCodeStep({ userCount }: { userCount: number }) {
  const { setNextEnabled, setStepData } = useWizard();
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [secretCopied, setSecretCopied] = useState(false);

  useEffect(() => {
    setNextEnabled(false);
  }, [setNextEnabled]);

  useEffect(() => {
    let cancelled = false;

    async function fetchTotpData() {
      const result = await enableTotp();
      if (cancelled) return;
      setIsLoading(false);
      if (result.data) {
        setSetupData(result.data);
        setStepData({ setupData: result.data });
        setNextEnabled(true);
      }
    }

    void fetchTotpData();
    return () => {
      cancelled = true;
    };
  }, [setNextEnabled, setStepData]);

  const handleCopySecret = async () => {
    if (!setupData) return;
    await navigator.clipboard.writeText(setupData.secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  return (
    <>
      {userCount === 1 && (
        <Alert variant="warning">
          <AlertTitle>Single account warning</AlertTitle>
          <AlertDescription>
            You are the only user account. If you lose access to your
            authenticator app and recovery codes, there will be no way to
            recover your account. Consider creating a second user account first.
          </AlertDescription>
        </Alert>
      )}
      <fieldset
        className={cx(
          'flex h-96 flex-col items-center justify-center rounded border',
          surfaceSpacingVariants(),
        )}
      >
        {isLoading || !setupData ? (
          <>
            <Spinner />
            <Paragraph>Generating secret...</Paragraph>
          </>
        ) : (
          <>
            <img
              src={setupData.qrCodeDataUrl}
              alt="QR code for authenticator app"
              className="mx-auto aspect-square grow"
            />
            <UnconnectedField
              name="secret"
              component={InputField}
              readOnly
              label="Can't scan the QR code? Enter this secret manually:"
              value={setupData.secret}
              className="font-monospace"
              suffixComponent={
                <Button size="sm" onClick={() => void handleCopySecret()}>
                  {secretCopied ? 'Copied!' : 'Copy'}
                </Button>
              }
            />
          </>
        )}
      </fieldset>
    </>
  );
}

function VerifyStep() {
  const { setNextEnabled, setStepData, goToStep, setBeforeNext } = useWizard();
  const [isVerifying, setIsVerifying] = useState(false);
  const [code, setCode] = useState<string | undefined>(undefined);

  useEffect(() => {
    setNextEnabled(false);
  }, [setNextEnabled]);

  useEffect(() => {
    setStepData({ code });
    setNextEnabled(code?.length === 6);
  }, [code, setNextEnabled, setStepData]);

  useEffect(() => {
    setBeforeNext(async () => {
      setIsVerifying(true);
      const result = await verifyTotpSetup({ code });

      setIsVerifying(false);

      if (result.error) {
        return false;
      }

      if (result.data) {
        setStepData({ recoveryCodes: result.data.recoveryCodes });
        return true;
      }

      return false;
    });
  }, [code, setBeforeNext, setStepData, goToStep]);

  return (
    <UnconnectedField
      name="code"
      label="Enter your 6-digit code from your authenticator app"
      component={SegmentedCodeField}
      required="Code is required"
      segments={6}
      characterSet="numeric"
      size="lg"
      autoComplete="off"
      value={code}
      onChange={(value) => setCode(value)}
      disabled={isVerifying}
    />
  );
}

function RecoveryCodesStep() {
  const { data, setBackEnabled } = useWizard();

  useEffect(() => {
    setBackEnabled(false);
  }, [setBackEnabled]);

  const codes = data.recoveryCodes as string[];

  return <RecoveryCodes codes={codes} />;
}

export function useTwoFactorSetup(userCount: number) {
  const { openDialog } = useDialog();

  const startSetup = useCallback(async () => {
    const result = await openDialog({
      type: 'wizard',
      title: 'Set Up Two-Factor Authentication',
      steps: [
        {
          title: 'Set Up Two-Factor Authentication',
          description:
            'Scan the QR code with your authenticator app, then enter the code to verify.',
          content: () => <QRCodeStep userCount={userCount} />,
        },
        {
          title: 'Verify Code',
          description:
            'Enter the 6-digit code from your authenticator app to verify setup.',
          content: VerifyStep,
          nextLabel: 'Verify',
        },
        {
          title: 'Save Recovery Codes',
          content: RecoveryCodesStep,
          nextLabel: "I've saved my recovery codes",
        },
      ],
    });

    return result !== null;
  }, [openDialog, userCount]);

  return startSetup;
}
