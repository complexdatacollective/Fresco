'use client';

import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { disableTotp, regenerateRecoveryCodes } from '~/actions/totp';
import RecoveryCodes from '~/components/RecoveryCodes';
import SettingsField from '~/components/settings/SettingsField';
import { useTwoFactorSetup } from '~/components/TwoFactorSetup';
import TwoFactorVerify from '~/components/TwoFactorVerify';
import { Alert, AlertDescription } from '~/components/ui/Alert';
import { Button } from '~/components/ui/Button';
import { Switch } from '~/components/ui/switch';
import Dialog from '~/lib/dialogs/Dialog';
import SubmitButton from '~/lib/form/components/SubmitButton';
import FormStoreProvider from '~/lib/form/store/formStoreProvider';

type TwoFactorSettingsProps = {
  hasTwoFactor: boolean;
  userCount: number;
  sandboxMode?: boolean;
};

export default function TwoFactorSettings({
  hasTwoFactor: initialHasTwoFactor,
  userCount,
  sandboxMode = false,
}: TwoFactorSettingsProps) {
  const [hasTwoFactor, setHasTwoFactor] = useState(initialHasTwoFactor);
  const [showDisable, setShowDisable] = useState(false);
  const [showRegenerateVerify, setShowRegenerateVerify] = useState(false);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const startTwoFactorSetup = useTwoFactorSetup(userCount);

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      const completed = await startTwoFactorSetup();
      if (completed) {
        setHasTwoFactor(true);
      }
    } else {
      setShowDisable(true);
    }
  };

  return (
    <>
      <SettingsField
        label="Two-Factor Authentication"
        description="Two factor authentication (2FA) adds an extra layer of security to your account by requiring a second form of verification in addition to your password. This can be a code from an authenticator app or a recovery code."
        testId="two-factor-field"
        control={
          <Switch
            checked={hasTwoFactor}
            onCheckedChange={(checked) => void handleToggle(checked)}
            disabled={sandboxMode}
            aria-label="Toggle two-factor authentication"
          />
        }
      >
        {hasTwoFactor && (
          <Button
            size="sm"
            onClick={() => setShowRegenerateVerify(true)}
            icon={<RefreshCw />}
          >
            Regenerate Recovery Codes
          </Button>
        )}
      </SettingsField>

      <FormStoreProvider>
        <Dialog
          open={showDisable}
          closeDialog={() => setShowDisable(false)}
          title="Disable Two-Factor Authentication"
          description="Enter your current authenticator code or a recovery code to disable two-factor authentication."
          footer={
            <>
              <Button onClick={() => setShowDisable(false)}>Cancel</Button>
              <SubmitButton
                form="disable-2fa"
                color="destructive"
                submittingText="Disabling..."
              >
                Disable
              </SubmitButton>
            </>
          }
        >
          <Alert variant="info">
            <AlertDescription>
              If you can&apos;t access your authenticator app, you need to use a
              recovery code to disable two-factor authentication. If you
              don&apos;t have any valid recovery codes, you will need another
              user to disable two-factor authentication for you.
            </AlertDescription>
          </Alert>
          <TwoFactorVerify
            formId="disable-2fa"
            onVerify={async (code) => {
              const result = await disableTotp({ code });
              if (result.error) throw new Error(result.error);
              setHasTwoFactor(false);
              setShowDisable(false);
            }}
            allowRecoveryCodes
          />
        </Dialog>
      </FormStoreProvider>

      <FormStoreProvider>
        <Dialog
          open={showRegenerateVerify}
          closeDialog={() => setShowRegenerateVerify(false)}
          title="Regenerate Recovery Codes"
          description="Enter your current authenticator code to generate new recovery codes. Your existing codes will be invalidated."
          footer={
            <>
              <Button onClick={() => setShowRegenerateVerify(false)}>
                Cancel
              </Button>
              <SubmitButton
                form="regenerate-recovery-codes"
                submittingText="Regenerating..."
              >
                Regenerate
              </SubmitButton>
            </>
          }
        >
          <Alert variant="info">
            <AlertDescription>
              If you can&apos;t access your authenticator app, you need to
              disable two-factor authentication using an existing recovery code
              before you generate new codes. If you don&apos;t have any valid
              recovery codes, you will need another user to disable two-factor
              authentication for you.
            </AlertDescription>
          </Alert>
          <TwoFactorVerify
            formId="regenerate-recovery-codes"
            onVerify={async (code) => {
              const result = await regenerateRecoveryCodes({ code });
              if (result.error) throw new Error(result.error);
              if (result.data) {
                setShowRegenerateVerify(false);
                setRecoveryCodes(result.data.recoveryCodes);
                setShowRecoveryCodes(true);
              }
            }}
          />
        </Dialog>
      </FormStoreProvider>

      <Dialog
        open={showRecoveryCodes}
        closeDialog={() => {
          setShowRecoveryCodes(false);
          setRecoveryCodes([]);
        }}
        title="New Recovery Codes"
        description="Your previous recovery codes have been invalidated. Save these new codes."
        footer={
          <Button
            color="primary"
            onClick={() => {
              setShowRecoveryCodes(false);
              setRecoveryCodes([]);
            }}
          >
            Done
          </Button>
        }
      >
        <RecoveryCodes codes={recoveryCodes} />
      </Dialog>
    </>
  );
}
