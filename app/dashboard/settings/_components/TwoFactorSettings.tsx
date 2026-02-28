'use client';

import { useState } from 'react';
import { disableTotp, regenerateRecoveryCodes } from '~/actions/totp';
import RecoveryCodes from '~/components/RecoveryCodes';
import SettingsField from '~/components/settings/SettingsField';
import { useTwoFactorSetup } from '~/components/TwoFactorSetup';
import TwoFactorVerify from '~/components/TwoFactorVerify';
import { Button } from '~/components/ui/Button';
import Dialog from '~/lib/dialogs/Dialog';

type TwoFactorSettingsProps = {
  hasTwoFactor: boolean;
  userCount: number;
};

export default function TwoFactorSettings({
  hasTwoFactor: initialHasTwoFactor,
  userCount,
}: TwoFactorSettingsProps) {
  const [hasTwoFactor, setHasTwoFactor] = useState(initialHasTwoFactor);
  const [showDisable, setShowDisable] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);
  const [isDisabling, setIsDisabling] = useState(false);
  const [showRegenerateVerify, setShowRegenerateVerify] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const startTwoFactorSetup = useTwoFactorSetup(userCount);

  const handleDisable = async (code: string) => {
    setIsDisabling(true);
    setDisableError(null);

    const result = await disableTotp({ code });

    setIsDisabling(false);

    if (result.error) {
      setDisableError(result.error);
      return;
    }

    setHasTwoFactor(false);
    setShowDisable(false);
  };

  const handleRegenerateRecoveryCodes = async (code: string) => {
    setIsRegenerating(true);
    setRegenerateError(null);

    const result = await regenerateRecoveryCodes({ code });

    setIsRegenerating(false);

    if (result.error) {
      setRegenerateError(result.error);
      return;
    }

    if (result.data) {
      setShowRegenerateVerify(false);
      setRecoveryCodes(result.data.recoveryCodes);
      setShowRecoveryCodes(true);
    }
  };

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
        control={
          <Button
            color="primary"
            size="sm"
            onClick={() => void handleEnableSetup()}
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

      <Dialog
        open={showDisable}
        closeDialog={() => {
          setShowDisable(false);
          setDisableError(null);
        }}
        title="Disable Two-Factor Authentication"
        description="Enter your current authenticator code to disable two-factor authentication."
      >
        <TwoFactorVerify
          onVerify={handleDisable}
          error={disableError}
          isSubmitting={isDisabling}
        />
      </Dialog>

      <Dialog
        open={showRegenerateVerify}
        closeDialog={() => {
          setShowRegenerateVerify(false);
          setRegenerateError(null);
        }}
        title="Regenerate Recovery Codes"
        description="Enter your current authenticator code to generate new recovery codes. Your existing codes will be invalidated."
      >
        <TwoFactorVerify
          onVerify={handleRegenerateRecoveryCodes}
          error={regenerateError}
          isSubmitting={isRegenerating}
        />
      </Dialog>

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
