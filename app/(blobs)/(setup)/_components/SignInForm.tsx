'use client';

import { ArrowLeft, User2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { login, type LoginResult } from '~/actions/auth';
import { verifyTwoFactor } from '~/actions/twoFactor';
import PasswordField from '~/app/(blobs)/(setup)/_components/PasswordField';
import TwoFactorVerify from '~/components/TwoFactorVerify';
import { Button } from '~/components/ui/Button';
import { DialogFooter } from '~/lib/dialogs/Dialog';
import Field from '~/lib/form/components/Field/Field';
import Form from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import InputField from '~/lib/form/components/fields/InputField';
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
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

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

  const handleTwoFactorVerify = async (code: string) => {
    setTwoFactorError(null);
    setIsVerifying(true);

    try {
      const result = await verifyTwoFactor({
        twoFactorToken,
        code,
      });

      if (result.success) {
        router.push('/dashboard');
        return;
      }

      if ('formErrors' in result && result.formErrors) {
        setTwoFactorError(result.formErrors[0] ?? 'Verification failed');
      } else {
        setTwoFactorError('Verification failed');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBackToSignIn = () => {
    setTwoFactorRequired(false);
    setTwoFactorToken(null);
    setTwoFactorError(null);
  };

  if (twoFactorRequired) {
    return (
      <div className="flex w-full flex-col gap-4">
        <TwoFactorVerify
          onVerify={handleTwoFactorVerify}
          error={twoFactorError}
          isSubmitting={isVerifying}
          showRecoveryOption
        />
        <Button variant="text" onClick={handleBackToSignIn}>
          <ArrowLeft className="size-4" />
          Back to sign in
        </Button>
      </div>
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
        prefixComponent={<User2 className="size-4" />}
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
