'use client';

import {
  browserSupportsWebAuthn,
  startAuthentication,
} from '@simplewebauthn/browser';
import { ArrowLeft, KeyRound, LockIcon, User2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { login, recoveryCodeLogin, type LoginResult } from '~/actions/auth';
import { verifyTwoFactor } from '~/actions/twoFactor';
import {
  generateAuthenticationOptions,
  verifyAuthentication,
} from '~/actions/webauthn';
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

  const [webauthnSupported, setWebauthnSupported] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    setWebauthnSupported(browserSupportsWebAuthn());
  }, []);

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

  const handlePasskeySignIn = async () => {
    setPasskeyError(null);
    setPasskeyLoading(true);

    try {
      const { error, data } = await generateAuthenticationOptions();
      if (error || !data) {
        setPasskeyError(error ?? 'Failed to start passkey authentication');
        return;
      }

      // IMMEDIATELY call startAuthentication — preserves Safari user gesture
      const credential = await startAuthentication({
        optionsJSON: data.options,
      });

      const result = await verifyAuthentication({ credential });
      if (result.error) {
        setPasskeyError(result.error);
        return;
      }

      router.push('/dashboard');
    } catch (e) {
      if (e instanceof Error && e.name === 'NotAllowedError') {
        return;
      }
      setPasskeyError('Passkey authentication failed');
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleRecoveryLogin: FormSubmitHandler = async (data) => {
    const values = data as Record<string, string>;
    const username = values.username;
    const recoveryCode = values.recoveryCode;

    if (!username || !recoveryCode) {
      return {
        success: false,
        formErrors: ['Username and recovery code are required'],
      };
    }

    const result = await recoveryCodeLogin({ username, recoveryCode });

    if (result.success) {
      router.push('/dashboard');
    }

    return result;
  };

  const handleBackToSignIn = () => {
    setTwoFactorRequired(false);
    setTwoFactorToken(null);
    setUseRecovery(false);
    setShowRecovery(false);
    setPasskeyError(null);
  };

  if (showRecovery) {
    return (
      <Form
        onSubmit={handleRecoveryLogin}
        id="recovery-login"
        className="w-full"
      >
        <Field
          name="username"
          label="Username"
          placeholder="Enter your username"
          component={InputField}
          required="Username is required"
          autoComplete="username"
          prefixComponent={<User2 />}
        />
        <Field
          name="recoveryCode"
          label="Recovery code"
          component={InputField}
          required="Recovery code is required"
          className="font-monospace tracking-widest"
          placeholder="0123456789abcdef0123"
          autoComplete="off"
        />
        <DialogFooter>
          <Button variant="text" type="button" onClick={handleBackToSignIn}>
            <ArrowLeft className="size-4" />
            Back to sign in
          </Button>
          <SubmitButton form="recovery-login" submittingText="Verifying...">
            Sign in
          </SubmitButton>
        </DialogFooter>
      </Form>
    );
  }

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
    <div className="flex w-full flex-col gap-4">
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

      {webauthnSupported && (
        <>
          <div className="flex items-center gap-3">
            <div className="bg-outline h-px flex-1" />
            <span className="text-neutral text-sm">or</span>
            <div className="bg-outline h-px flex-1" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handlePasskeySignIn}
            disabled={passkeyLoading}
          >
            <KeyRound className="size-4" />
            {passkeyLoading
              ? 'Waiting for passkey...'
              : 'Sign in with a passkey'}
          </Button>

          {passkeyError && (
            <p className="text-destructive text-center text-sm">
              {passkeyError}
            </p>
          )}
        </>
      )}

      <Button
        variant="link"
        type="button"
        onClick={() => setShowRecovery(true)}
        className="text-neutral text-sm"
      >
        Trouble signing in?
      </Button>
    </div>
  );
};
