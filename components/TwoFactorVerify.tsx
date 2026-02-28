'use client';

import { useState } from 'react';
import Field from '~/lib/form/components/Field/Field';
import Form from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import InputField from '~/lib/form/components/fields/InputField';
import SegmentedCodeField from '~/lib/form/components/fields/SegmentedCodeField';
import { type FormSubmitHandler } from '~/lib/form/store/types';

type TwoFactorVerifyProps = {
  onVerify: (code: string) => void | Promise<void>;
  error?: string | null;
  isSubmitting?: boolean;
  showRecoveryOption?: boolean;
  formId?: string;
};

export default function TwoFactorVerify({
  onVerify,
  error,
  isSubmitting,
  showRecoveryOption,
  formId,
}: TwoFactorVerifyProps) {
  const [useRecovery, setUseRecovery] = useState(false);

  const handleSubmit: FormSubmitHandler = async (data) => {
    const values = data as Record<string, string>;
    const code = values.code;
    if (!code) {
      return { success: false, fieldErrors: { code: ['Code is required'] } };
    }
    try {
      await onVerify(code);
      return { success: true };
    } catch {
      return { success: false, formErrors: ['Verification failed'] };
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Form
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
        {!formId && (
          <SubmitButton disabled={isSubmitting} submittingText="Verifying...">
            Verify
          </SubmitButton>
        )}
      </Form>
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
      {showRecoveryOption && (
        <button
          type="button"
          onClick={() => setUseRecovery((prev) => !prev)}
          className="text-sm text-current/70 underline underline-offset-4 hover:text-current"
        >
          {useRecovery
            ? 'Use authenticator app instead'
            : 'Use a recovery code instead'}
        </button>
      )}
    </div>
  );
}
