'use client';

import { ArrowLeft, LockIcon, User2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { login, type LoginResult } from '~/actions/auth';
import { verifyTwoFactor } from '~/actions/twoFactor';
import { Button } from '~/components/ui/Button';
import { DialogFooter } from '~/lib/dialogs/Dialog';
import Field from '~/lib/form/components/Field/Field';
import Form from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import InputField from '~/lib/form/components/fields/InputField';
import PasswordField from '~/lib/form/components/fields/PasswordField';
import SegmentedCodeField from '~/lib/form/components/fields/SegmentedCodeField';
import { type FormSubmitHandler } from '~/lib/form/store/types';
import { loginSchema } from '~/schemas/auth';

function isRateLimited(
  result: LoginResult,
): result is { success: false; rateLimited: true; retryAfter: number } {
  return 'rateLimited' in result;
}

function isTwoFactorRequired(result: LoginResult): result is {
  success: false;
  requiresTwoFactor: true;
  twoFactorToken: string;
} {
  return 'requiresTwoFactor' in result;
}

export const SignInForm = () => {
  const router = useRouter();

  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [useRecovery, setUseRecovery] = useState(false);

  useEffect(() => {
    if (retryAfter === null || retryAfter <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setRetryAfter((prev) => {
        if (prev === null || prev <= 1) {
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [retryAfter]);

  const handleSubmit: FormSubmitHandler = async (data) => {
    const result = await login(data);

    if (isRateLimited(result)) {
      const secondsRemaining = Math.ceil(
        (result.retryAfter - Date.now()) / 1000,
      );
      setRetryAfter(Math.max(secondsRemaining, 1));
      return {
        success: false,
        formErrors: [
          `Too many attempts. Try again in ${String(Math.max(secondsRemaining, 1))} seconds.`,
        ],
      };
    }

    if (isTwoFactorRequired(result)) {
      setTwoFactorToken(result.twoFactorToken);
      setTwoFactorRequired(true);
      return { success: false };
    }

    if (result.success === true) {
      router.push('/dashboard');
    }

    return result;
  };

  const handleTwoFactorSubmit: FormSubmitHandler = async (data) => {
    const values = data as Record<string, string>;
    const code = values.code;
    if (!code) {
      return { success: false, fieldErrors: { code: ['Code is required'] } };
    }

    const result = await verifyTwoFactor({ twoFactorToken, code });

    if (!result.success) {
      const error =
        'formErrors' in result && result.formErrors
          ? (result.formErrors[0] ?? 'Verification failed')
          : 'Verification failed';
      return { success: false, formErrors: [error] };
    }

    router.push('/dashboard');
    return { success: true };
  };

  const handleBackToSignIn = () => {
    setTwoFactorRequired(false);
    setTwoFactorToken(null);
    setUseRecovery(false);
  };

  if (twoFactorRequired) {
    return (
      <Form
        key={useRecovery ? 'recovery' : 'totp'}
        onSubmit={handleTwoFactorSubmit}
        id="sign-in-2fa"
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
        <Button
          type="button"
          onClick={() => setUseRecovery((prev) => !prev)}
          variant="link"
        >
          {useRecovery
            ? 'Use authenticator app instead'
            : 'Use a recovery code instead'}
        </Button>

        <DialogFooter>
          <Button variant="text" onClick={handleBackToSignIn}>
            <ArrowLeft className="size-4" />
            Back to sign in
          </Button>
          <SubmitButton form="sign-in-2fa" submittingText="Verifying...">
            Verify
          </SubmitButton>
        </DialogFooter>
      </Form>
    );
  }

  return (
    <Form onSubmit={handleSubmit} className="w-full">
      <Field
        key="username"
        name="username"
        label="Username"
        placeholder="Enter your username"
        custom={{
          schema: loginSchema.shape.username,
          hint: 'Enter your username',
        }}
        component={InputField}
        autoComplete="username"
        prefixComponent={<User2 />}
      />
      <Field
        key="password"
        name="password"
        label="Password"
        placeholder="Enter your password"
        component={PasswordField}
        custom={{
          schema: loginSchema.shape.password,
          hint: 'Enter your password',
        }}
        autoComplete="current-password"
        prefixComponent={<LockIcon />}
      />
      <DialogFooter>
        <SubmitButton
          key="submit"
          submittingText="Signing in..."
          disabled={retryAfter !== null && retryAfter > 0}
        >
          {retryAfter !== null && retryAfter > 0
            ? `Try again in ${String(retryAfter)}s`
            : 'Sign In'}
        </SubmitButton>
      </DialogFooter>
    </Form>
  );
};
