'use client';

import { useState } from 'react';

import { createMessageError, defineMessages } from '@codaco/app-i18n/messages';
import { useAppIntl } from '@codaco/app-i18n/react';
import { Button } from '@codaco/fresco-ui/Button';
import Field from '@codaco/fresco-ui/form/Field/Field';
import InputField from '@codaco/fresco-ui/form/fields/InputField';
import SegmentedCodeField from '@codaco/fresco-ui/form/fields/SegmentedCodeField';
import { FormWithoutProvider } from '@codaco/fresco-ui/form/Form';
import {
  type FormSubmissionResult,
  type FormSubmitHandler,
} from '@codaco/fresco-ui/form/store/types';
import { verifyCurrentUserTotp } from '~/actions/totp';

const messages = defineMessages({
  requiredRecovery: {
    id: 'fresco.TwoFactorVerify.requiredRecovery',
    defaultMessage: 'Recovery code is required',
    description: 'Researcher-facing TwoFactorVerify: Recovery code is required',
  },

  requiredCode: {
    id: 'fresco.TwoFactorVerify.requiredCode',
    defaultMessage: 'Code is required',
    description: 'Researcher-facing TwoFactorVerify: Code is required',
  },

  copyCodeIsRequired: {
    id: 'fresco.TwoFactorVerify.copyCodeIsRequired',
    defaultMessage: 'Code is required',
    description: 'Researcher-facing TwoFactorVerify: Code is required',
  },
  copyUseAuthenticatorAppInstead: {
    id: 'fresco.TwoFactorVerify.copyUseAuthenticatorAppInstead',
    defaultMessage: 'Use authenticator app instead',
    description:
      'Researcher-facing TwoFactorVerify: Use authenticator app instead',
  },
  copyUseARecoveryCodeInstead: {
    id: 'fresco.TwoFactorVerify.copyUseARecoveryCodeInstead',
    defaultMessage: 'Use a recovery code instead',
    description:
      'Researcher-facing TwoFactorVerify: Use a recovery code instead',
  },
  enterOneOfYourRecoveryCodes: {
    id: 'fresco.TwoFactorVerify.enterOneOfYourRecoveryCodes',
    defaultMessage: 'Enter one of your recovery codes',
    description:
      'Researcher-facing TwoFactorVerify: Enter one of your recovery codes',
  },
  example0123456789abcdef0123: {
    id: 'fresco.TwoFactorVerify.0123456789abcdef0123',
    defaultMessage: '0123456789abcdef0123',
    description: 'Researcher-facing TwoFactorVerify: 0123456789abcdef0123',
  },
  enterYour6DigitCodeFromYour: {
    id: 'fresco.TwoFactorVerify.enterYour6DigitCodeFromYour',
    defaultMessage: 'Enter your 6-digit code from your authenticator app',
    description:
      'Researcher-facing TwoFactorVerify: Enter your 6-digit code from your authenticator app',
  },
});

type TwoFactorVerifyProps = {
  formId: string;
  /**
   * Runs once the code is verified, as part of the same submission: the form
   * reads as submitting until it settles, and a failure it returns is shown
   * on the form like a rejected code.
   */
  onVerify: (code: string) => Promise<FormSubmissionResult>;
  allowRecoveryCodes?: boolean;
};

export default function TwoFactorVerify({
  formId,
  onVerify,
  allowRecoveryCodes,
}: TwoFactorVerifyProps) {
  const intl = useAppIntl();

  const [useRecovery, setUseRecovery] = useState(false);

  const handleSubmit: FormSubmitHandler = async (data) => {
    const values = data as Record<string, string>;
    const code = values.code;
    if (!code) {
      return {
        success: false,
        fieldErrors: {
          code: [createMessageError(messages.copyCodeIsRequired)],
        },
      };
    }

    const result = await verifyCurrentUserTotp(code);
    if (!result.success) {
      return result;
    }

    return onVerify(code);
  };

  return (
    <FormWithoutProvider
      key={useRecovery ? 'recovery' : 'totp'}
      onSubmit={handleSubmit}
      id={formId}
    >
      {useRecovery ? (
        <Field
          name="code"
          label={intl.formatMessage(messages.enterOneOfYourRecoveryCodes)}
          component={InputField}
          required={intl.formatMessage(messages.requiredRecovery)}
          className="font-monospace tracking-widest"
          placeholder={intl.formatMessage(messages.example0123456789abcdef0123)}
          autoComplete="off"
        />
      ) : (
        <Field
          name="code"
          label={intl.formatMessage(messages.enterYour6DigitCodeFromYour)}
          component={SegmentedCodeField}
          required={intl.formatMessage(messages.requiredCode)}
          segments={6}
          characterSet="numeric"
          size="lg"
        />
      )}
      {allowRecoveryCodes && (
        <Button
          type="button"
          onClick={() => setUseRecovery((prev) => !prev)}
          variant="link"
        >
          {useRecovery
            ? intl.formatMessage(messages.copyUseAuthenticatorAppInstead)
            : intl.formatMessage(messages.copyUseARecoveryCodeInstead)}
        </Button>
      )}
    </FormWithoutProvider>
  );
}
