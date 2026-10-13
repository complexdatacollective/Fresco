'use client';

import { RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { commonMessages } from '@codaco/app-i18n/common';
import { defineMessages } from '@codaco/app-i18n/messages';
import { useAppIntl } from '@codaco/app-i18n/react';
import { Alert, AlertDescription } from '@codaco/fresco-ui/Alert';
import { Button } from '@codaco/fresco-ui/Button';
import Dialog from '@codaco/fresco-ui/dialogs/Dialog';
import ToggleField from '@codaco/fresco-ui/form/fields/ToggleField';
import FormStoreProvider from '@codaco/fresco-ui/form/store/formStoreProvider';
import SubmitButton from '@codaco/fresco-ui/form/SubmitButton';
import { disableTotp, regenerateRecoveryCodes } from '~/actions/totp';
import FormDialog from '~/components/FormDialog';
import RecoveryCodes from '~/components/RecoveryCodes';
import SettingsField from '~/components/settings/SettingsField';
import { useTwoFactorSetup } from '~/components/TwoFactorSetup';
import TwoFactorVerify from '~/components/TwoFactorVerify';

const messages = defineMessages({
  regenerating: {
    id: 'fresco.TwoFactorSettings.regenerating',
    defaultMessage: 'Regenerating...',
    description: 'Researcher-facing TwoFactorSettings: Regenerating...',
  },

  disabling: {
    id: 'fresco.TwoFactorSettings.disabling',
    defaultMessage: 'Disabling...',
    description: 'Researcher-facing TwoFactorSettings: Disabling...',
  },

  twoFactorAuthentication: {
    id: 'fresco.settings.TwoFactorSettings.twoFactorAuthentication',
    defaultMessage: 'Two-Factor Authentication',
    description:
      'Researcher-facing settings / TwoFactorSettings: Two-Factor Authentication',
  },
  twoFactorAuthentication2FAAddsAnExtra: {
    id: 'fresco.settings.TwoFactorSettings.twoFactorAuthentication2FAAddsAnExtra',
    defaultMessage:
      'Two factor authentication (2FA) adds an extra layer of security to your account by requiring a second form of verification in addition to your password. This can be a code from an authenticator app or a recovery code.',
    description:
      'Researcher-facing settings / TwoFactorSettings: Two factor authentication (2FA) adds an extra layer of security to your account by requiring a second form of verificati',
  },
  toggleTwoFactorAuthentication: {
    id: 'fresco.settings.TwoFactorSettings.toggleTwoFactorAuthentication',
    defaultMessage: 'Toggle two-factor authentication',
    description:
      'Researcher-facing settings / TwoFactorSettings: Toggle two-factor authentication',
  },
  regenerateRecoveryCodes: {
    id: 'fresco.settings.TwoFactorSettings.regenerateRecoveryCodes',
    defaultMessage: 'Regenerate Recovery Codes',
    description:
      'Researcher-facing settings / TwoFactorSettings: Regenerate Recovery Codes',
  },
  disableTwoFactorAuthentication: {
    id: 'fresco.settings.TwoFactorSettings.disableTwoFactorAuthentication',
    defaultMessage: 'Disable Two-Factor Authentication',
    description:
      'Researcher-facing settings / TwoFactorSettings: Disable Two-Factor Authentication',
  },
  enterYourCurrentAuthenticatorCodeOrA: {
    id: 'fresco.settings.TwoFactorSettings.enterYourCurrentAuthenticatorCodeOrA',
    defaultMessage:
      'Enter your current authenticator code or a recovery code to disable two-factor authentication.',
    description:
      'Researcher-facing settings / TwoFactorSettings: Enter your current authenticator code or a recovery code to disable two-factor authentication.',
  },
  disable: {
    id: 'fresco.settings.TwoFactorSettings.disable',
    defaultMessage: 'Disable',
    description: 'Researcher-facing settings / TwoFactorSettings: Disable',
  },
  ifYouCanAposTAccessYour: {
    id: 'fresco.settings.TwoFactorSettings.ifYouCanAposTAccessYour',
    defaultMessage:
      "If you can't access your authenticator app, you need to use a recovery code to disable two-factor authentication. If you don't have any valid recovery codes, you will need another user to disable two-factor authentication for you.",
    description:
      "Researcher-facing settings / TwoFactorSettings: If you can't access your authenticator app, you need to use a recovery code to disable two-factor authentication. I",
  },
  enterYourCurrentAuthenticatorCodeToGenerate: {
    id: 'fresco.settings.TwoFactorSettings.enterYourCurrentAuthenticatorCodeToGenerate',
    defaultMessage:
      'Enter your current authenticator code to generate new recovery codes. Your existing codes will be invalidated.',
    description:
      'Researcher-facing settings / TwoFactorSettings: Enter your current authenticator code to generate new recovery codes. Your existing codes will be invalidated.',
  },
  regenerate: {
    id: 'fresco.settings.TwoFactorSettings.regenerate',
    defaultMessage: 'Regenerate',
    description: 'Researcher-facing settings / TwoFactorSettings: Regenerate',
  },
  ifYouCanAposTAccessYour2: {
    id: 'fresco.settings.TwoFactorSettings.ifYouCanAposTAccessYour2',
    defaultMessage:
      "If you can't access your authenticator app, you need to disable two-factor authentication using an existing recovery code before you generate new codes. If you don't have any valid recovery codes, you will need another user to disable two-factor authentication for you.",
    description:
      "Researcher-facing settings / TwoFactorSettings: If you can't access your authenticator app, you need to disable two-factor authentication using an existing recover",
  },
  newRecoveryCodes: {
    id: 'fresco.settings.TwoFactorSettings.newRecoveryCodes',
    defaultMessage: 'New Recovery Codes',
    description:
      'Researcher-facing settings / TwoFactorSettings: New Recovery Codes',
  },
  yourPreviousRecoveryCodesHaveBeenInvalidated: {
    id: 'fresco.settings.TwoFactorSettings.yourPreviousRecoveryCodesHaveBeenInvalidated',
    defaultMessage:
      'Your previous recovery codes have been invalidated. Save these new codes.',
    description:
      'Researcher-facing settings / TwoFactorSettings: Your previous recovery codes have been invalidated. Save these new codes.',
  },
  requiredOnThisInstallation: {
    id: 'fresco.settings.TwoFactorSettings.requiredOnThisInstallation',
    defaultMessage:
      'Two-factor authentication is required on this installation for every account that signs in with a password, so it cannot be turned off here.',
    description:
      'Shown beside the per-account two-factor switch when the REQUIRE_TWO_FACTOR environment variable is set.',
  },
});

type TwoFactorSettingsProps = {
  hasTwoFactor: boolean;
  userCount: number;
  sandboxMode?: boolean;
  /** Whether the installation requires two-factor authentication (`REQUIRE_TWO_FACTOR`). */
  twoFactorRequired?: boolean;
};

export default function TwoFactorSettings({
  hasTwoFactor: initialHasTwoFactor,
  userCount,
  sandboxMode = false,
  twoFactorRequired = false,
}: TwoFactorSettingsProps) {
  const intl = useAppIntl();

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
        label={intl.formatMessage(messages.twoFactorAuthentication)}
        description={intl.formatMessage(
          messages.twoFactorAuthentication2FAAddsAnExtra,
        )}
        testId="two-factor-field"
        control={
          <ToggleField
            value={hasTwoFactor}
            onChange={(checked) => void handleToggle(checked ?? false)}
            // The server refuses to disable it while the policy is on; the
            // switch says so rather than offering a change that cannot happen.
            disabled={sandboxMode || (hasTwoFactor && twoFactorRequired)}
            aria-label={intl.formatMessage(
              messages.toggleTwoFactorAuthentication,
            )}
          />
        }
      >
        {hasTwoFactor && twoFactorRequired && (
          <Alert variant="info" className="mb-3">
            <AlertDescription>
              {intl.formatMessage(messages.requiredOnThisInstallation)}
            </AlertDescription>
          </Alert>
        )}
        {hasTwoFactor && (
          <Button
            size="sm"
            onClick={() => setShowRegenerateVerify(true)}
            icon={<RefreshCw />}
          >
            {intl.formatMessage(messages.regenerateRecoveryCodes)}
          </Button>
        )}
      </SettingsField>

      <FormStoreProvider>
        <FormDialog
          open={showDisable}
          closeDialog={() => setShowDisable(false)}
          title={intl.formatMessage(messages.disableTwoFactorAuthentication)}
          description={intl.formatMessage(
            messages.enterYourCurrentAuthenticatorCodeOrA,
          )}
          footer={(heldOpen) => (
            <>
              <Button onClick={() => setShowDisable(false)} disabled={heldOpen}>
                {intl.formatMessage(commonMessages.cancel)}
              </Button>
              <SubmitButton
                form="disable-2fa"
                color="destructive"
                submittingText={intl.formatMessage(messages.disabling)}
              >
                {intl.formatMessage(messages.disable)}
              </SubmitButton>
            </>
          )}
        >
          <Alert variant="info">
            <AlertDescription>
              {intl.formatMessage(messages.ifYouCanAposTAccessYour)}
            </AlertDescription>
          </Alert>
          <TwoFactorVerify
            formId="disable-2fa"
            onVerify={async (code) => {
              const result = await disableTotp({ code });
              if (result.error) {
                return { success: false, formErrors: [result.error] };
              }
              setHasTwoFactor(false);
              setShowDisable(false);
              return { success: true };
            }}
            allowRecoveryCodes
          />
        </FormDialog>
      </FormStoreProvider>

      <FormStoreProvider>
        <FormDialog
          open={showRegenerateVerify}
          closeDialog={() => setShowRegenerateVerify(false)}
          title={intl.formatMessage(messages.regenerateRecoveryCodes)}
          description={intl.formatMessage(
            messages.enterYourCurrentAuthenticatorCodeToGenerate,
          )}
          footer={(heldOpen) => (
            <>
              <Button
                onClick={() => setShowRegenerateVerify(false)}
                disabled={heldOpen}
              >
                {intl.formatMessage(commonMessages.cancel)}
              </Button>
              <SubmitButton
                form="regenerate-recovery-codes"
                submittingText={intl.formatMessage(messages.regenerating)}
              >
                {intl.formatMessage(messages.regenerate)}
              </SubmitButton>
            </>
          )}
        >
          <Alert variant="info">
            <AlertDescription>
              {intl.formatMessage(messages.ifYouCanAposTAccessYour2)}
            </AlertDescription>
          </Alert>
          <TwoFactorVerify
            formId="regenerate-recovery-codes"
            onVerify={async (code) => {
              const result = await regenerateRecoveryCodes({ code });
              if (result.error) {
                return { success: false, formErrors: [result.error] };
              }
              if (result.data) {
                setShowRegenerateVerify(false);
                setRecoveryCodes(result.data.recoveryCodes);
                setShowRecoveryCodes(true);
              }
              return { success: true };
            }}
          />
        </FormDialog>
      </FormStoreProvider>

      <Dialog
        open={showRecoveryCodes}
        closeDialog={() => {
          setShowRecoveryCodes(false);
          setRecoveryCodes([]);
        }}
        title={intl.formatMessage(messages.newRecoveryCodes)}
        description={intl.formatMessage(
          messages.yourPreviousRecoveryCodesHaveBeenInvalidated,
        )}
        footer={
          <Button
            color="primary"
            onClick={() => {
              setShowRecoveryCodes(false);
              setRecoveryCodes([]);
            }}
          >
            {intl.formatMessage(commonMessages.done)}
          </Button>
        }
      >
        <RecoveryCodes codes={recoveryCodes} />
      </Dialog>
    </>
  );
}
