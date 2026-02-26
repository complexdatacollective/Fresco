'use client';

import { type FormEvent, useState } from 'react';
import { Button } from '~/components/ui/Button';
import { cx } from '~/utils/cva';

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
  const [code, setCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void onVerify(code);
  };

  return (
    <form onSubmit={handleSubmit} id={formId} className="flex flex-col gap-4">
      <label className="text-sm font-medium">
        {useRecovery
          ? 'Enter one of your recovery codes'
          : 'Enter your 6-digit code from your authenticator app'}
      </label>
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={useRecovery ? 20 : 6}
        inputMode={useRecovery ? 'text' : 'numeric'}
        pattern={useRecovery ? '[0-9a-f]*' : '[0-9]*'}
        autoComplete="one-time-code"
        autoFocus
        placeholder={useRecovery ? '0123456789abcdef0123' : '000000'}
        className={cx(
          'bg-input text-input-contrast rounded border-2 border-transparent px-4 py-2',
          'font-monospace text-center text-lg tracking-widest',
          'focus-visible:focus-styles outline-current',
          'placeholder:text-input-contrast/50 placeholder:italic',
          error && 'border-destructive',
        )}
      />
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
      {!formId && (
        <Button
          type="submit"
          color="primary"
          disabled={Boolean(isSubmitting) || code.length === 0}
        >
          {isSubmitting ? 'Verifying...' : 'Verify'}
        </Button>
      )}
      {showRecoveryOption && (
        <button
          type="button"
          onClick={() => {
            setUseRecovery((prev) => !prev);
            setCode('');
          }}
          className="text-sm text-current/70 underline underline-offset-4 hover:text-current"
        >
          {useRecovery
            ? 'Use authenticator app instead'
            : 'Use a recovery code instead'}
        </button>
      )}
    </form>
  );
}
