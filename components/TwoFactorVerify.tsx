'use client';

import { useState } from 'react';
import { verifyCurrentUserTotp } from '~/actions/totp';
import Field from '~/lib/form/components/Field/Field';
import { FormWithoutProvider } from '~/lib/form/components/Form';
import InputField from '~/lib/form/components/fields/InputField';
import SegmentedCodeField from '~/lib/form/components/fields/SegmentedCodeField';
import { type FormSubmitHandler } from '~/lib/form/store/types';
import { Button } from './ui/Button';

type TwoFactorVerifyProps = {
  formId: string;
  onVerify: (code: string) => void | Promise<void>;
  allowRecoveryCodes?: boolean;
};

export default function TwoFactorVerify({
  formId,
  onVerify,
  allowRecoveryCodes,
}: TwoFactorVerifyProps) {
  const [useRecovery, setUseRecovery] = useState(false);

  const handleSubmit: FormSubmitHandler = async (data) => {
    const values = data as Record<string, string>;
    const code = values.code;
    if (!code) {
      return { success: false, fieldErrors: { code: ['Code is required'] } };
    }

    const result = await verifyCurrentUserTotp(code);
    if (!result.success) {
      return result;
    }

    void onVerify(code);

    return { success: true };
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
          label="Enter one of your recovery codes"
          component={InputField}
          required="Recovery code is required"
          className="font-monospace tracking-widest"
          placeholder="0123456789abcdef0123"
          autoComplete="off"
        />
      ) : (
        <Field
          name="code"
          label="Enter your 6-digit code from your authenticator app"
          component={SegmentedCodeField}
          required="Code is required"
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
            ? 'Use authenticator app instead'
            : 'Use a recovery code instead'}
        </Button>
      )}
    </FormWithoutProvider>
  );
}
