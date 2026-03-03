'use client';

import { useState } from 'react';
import { disableTotp, regenerateRecoveryCodes } from '~/actions/totp';
import RecoveryCodes from '~/components/RecoveryCodes';
import SettingsField from '~/components/settings/SettingsField';
import { useTwoFactorSetup } from '~/components/TwoFactorSetup';
import TwoFactorVerify from '~/components/TwoFactorVerify';
import { Button } from '~/components/ui/Button';
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

  const handleEnableSetup = async () => {
    const completed = await startTwoFactorSetup();
    if (completed) {
      setHasTwoFactor(true);
    }
  };

  if (!hasTwoFactor) {
    return (
      <SettingsField
        label="Two-Factor Authentication"
        description="Add an extra layer of security to your account by requiring a code from your authenticator app when signing in."
        testId="two-factor-field"
        control={
          <Button
            color="primary"
            size="sm"
            onClick={() => void handleEnableSetup()}
            disabled={sandboxMode}
          >
            Enable
          </Button>
        }
      />
    );
  }

  return (
    <>
      <SettingsField
        label="Two-Factor Authentication"
        description="Two-factor authentication is enabled for your account."
        testId="two-factor-field"
        control={
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowRegenerateVerify(true)}>
              Regenerate Recovery Codes
            </Button>
            <Button
              color="destructive"
              size="sm"
              onClick={() => setShowDisable(true)}
            >
              Disable
            </Button>
          </div>
        }
      />

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
