'use client';

import {
  browserSupportsWebAuthn,
  startRegistration,
} from '@simplewebauthn/browser';
import { KeyRound, LockIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signup } from '~/actions/auth';
import {
  generateRegistrationOptions,
  verifyRegistration,
} from '~/actions/webauthn';
import RecoveryCodes from '~/components/RecoveryCodes';
import { Button } from '~/components/ui/Button';
import Field from '~/lib/form/components/Field/Field';
import FieldGroup from '~/lib/form/components/FieldGroup';
import InputField from '~/lib/form/components/fields/InputField';
import Form from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import { type FormSubmitHandler } from '~/lib/form/store/types';
import { createUserSchema } from '~/schemas/auth';

type AuthMethod = 'password' | 'passkey';

type SignUpFormProps = {
  sandboxMode?: boolean;
};

export const SignUpForm = ({ sandboxMode = false }: SignUpFormProps) => {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
  const [webauthnSupported, setWebauthnSupported] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  useEffect(() => {
    setWebauthnSupported(browserSupportsWebAuthn());
  }, []);

  const handlePasswordSubmit: FormSubmitHandler = async (data) => {
    const result = await signup(data);

    if (result.success === true) {
      router.refresh();
      router.push('/setup?step=2');
      return { success: true };
    }

    return {
      success: false,
      errors: {
        form: result.error ? [result.error] : [],
      },
    };
  };

  const handlePasskeySubmit: FormSubmitHandler = async (data) => {
    const values = data as Record<string, string>;
    const username = values.username;

    if (!username) {
      return {
        success: false,
        formErrors: ['Username is required'],
      };
    }

    setPasskeyError(null);
    setPasskeyLoading(true);

    try {
      // First create the user with no password
      const signupResult = await signup({
        username,
        password: null,
        confirmPassword: null,
      });

      if (signupResult.success !== true) {
        setPasskeyLoading(false);
        return {
          success: false,
          formErrors: [signupResult.error ?? 'Failed to create account'],
        };
      }

      // Now register the passkey — user is authenticated via the signup session
      const { error: genError, data: regData } =
        await generateRegistrationOptions('Default passkey');
      if (genError ?? !regData) {
        setPasskeyLoading(false);
        setPasskeyError(genError ?? 'Failed to start passkey registration');
        // Account was created but passkey registration failed
        // Redirect to setup step 2 — they can add a passkey later
        router.refresh();
        router.push('/setup?step=2');
        return { success: true };
      }

      // IMMEDIATELY call startRegistration — preserves Safari user gesture
      const credential = await startRegistration({
        optionsJSON: regData.options,
      });

      const verifyResult = await verifyRegistration({
        credential,
        friendlyName: 'Default passkey',
      });

      if (verifyResult.error) {
        setPasskeyError(verifyResult.error);
        // Account was created, passkey failed, continue anyway
        router.refresh();
        router.push('/setup?step=2');
        return { success: true };
      }

      // TODO: Show recovery codes before proceeding
      // For now, proceed to step 2
      router.refresh();
      router.push('/setup?step=2');
      return { success: true };
    } catch (e) {
      if (e instanceof Error && e.name === 'NotAllowedError') {
        setPasskeyLoading(false);
        return { success: false };
      }
      setPasskeyError('Passkey registration failed');
      setPasskeyLoading(false);
      // Account may have been created, try to continue
      router.refresh();
      router.push('/setup?step=2');
      return { success: true };
    }
  };

  if (recoveryCodes) {
    return (
      <div className="flex flex-col gap-4">
        <RecoveryCodes codes={recoveryCodes} />
        <Button
          color="primary"
          onClick={() => {
            setRecoveryCodes(null);
            router.refresh();
            router.push('/setup?step=2');
          }}
        >
          I saved my recovery codes
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {webauthnSupported && !sandboxMode && (
        <div className="flex gap-2">
          <Button
            variant={authMethod === 'password' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setAuthMethod('password')}
            type="button"
          >
            <LockIcon className="size-4" />
            Set a password
          </Button>
          <Button
            variant={authMethod === 'passkey' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setAuthMethod('passkey')}
            type="button"
          >
            <KeyRound className="size-4" />
            Use a passkey
          </Button>
        </div>
      )}

      {authMethod === 'password' ? (
        <Form
          onSubmit={handlePasswordSubmit}
          className="flex flex-col"
          key="password-signup"
        >
          <Field
            key="username"
            name="username"
            label="Username"
            placeholder="username..."
            hint="Your username should be at least 4 characters, and must not contain any spaces."
            custom={{
              schema: createUserSchema.shape.username,
              hint: 'At least 4 characters, no spaces',
            }}
            component={InputField}
            autoComplete="do-not-autofill"
          />
          <Field
            key="password"
            name="password"
            label="Password"
            placeholder="******************"
            hint="Your password must be at least 8 characters long, and contain at least one each of lowercase, uppercase, number and symbol characters."
            custom={{
              schema: createUserSchema.shape.password,
              hint: 'At least 8 characters with lowercase, uppercase, number and symbol',
            }}
            component={InputField}
            type="password"
            autoComplete="do-not-autofill"
          />
          <FieldGroup
            watch={['password']}
            condition={(values) => !!values.password}
          >
            <Field
              key="confirmPassword"
              name="confirmPassword"
              label="Confirm password"
              placeholder="******************"
              sameAs="password"
              component={InputField}
              type="password"
              autoComplete="do-not-autofill"
            />
          </FieldGroup>
          <SubmitButton key="submit" className="mt-6">
            Create account
          </SubmitButton>
        </Form>
      ) : (
        <Form
          onSubmit={handlePasskeySubmit}
          className="flex flex-col"
          key="passkey-signup"
        >
          <Field
            key="username"
            name="username"
            label="Username"
            placeholder="username..."
            hint="Your username should be at least 4 characters, and must not contain any spaces."
            custom={{
              schema: createUserSchema.shape.username,
              hint: 'At least 4 characters, no spaces',
            }}
            component={InputField}
            autoComplete="do-not-autofill"
          />
          {passkeyError && (
            <p className="text-destructive text-sm">{passkeyError}</p>
          )}
          <SubmitButton key="submit" className="mt-6" disabled={passkeyLoading}>
            {passkeyLoading
              ? 'Registering passkey...'
              : 'Create account with passkey'}
          </SubmitButton>
        </Form>
      )}
    </div>
  );
};
