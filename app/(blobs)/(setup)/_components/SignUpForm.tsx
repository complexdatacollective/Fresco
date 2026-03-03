'use client';

import {
  browserSupportsWebAuthn,
  startRegistration,
} from '@simplewebauthn/browser';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signup } from '~/actions/auth';
import {
  generateSignupRegistrationOptions,
  signupWithPasskey,
} from '~/actions/webauthn';
import Field from '~/lib/form/components/Field/Field';
import FieldGroup from '~/lib/form/components/FieldGroup';
import InputField from '~/lib/form/components/fields/InputField';
import RichSelectGroupField from '~/lib/form/components/fields/RichSelectGroup';
import Form from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import {
  type FormSubmissionResult,
  type FormSubmitHandler,
} from '~/lib/form/store/types';
import { createUserSchema } from '~/schemas/auth';

type SignUpFormProps = {
  sandboxMode?: boolean;
};

export const SignUpForm = ({ sandboxMode = false }: SignUpFormProps) => {
  const router = useRouter();
  const [webauthnSupported, setWebauthnSupported] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  useEffect(() => {
    setWebauthnSupported(browserSupportsWebAuthn());
  }, []);

  const showAuthMethodChoice = webauthnSupported && !sandboxMode;

  const handleSubmit: FormSubmitHandler = async (data) => {
    const values = data as Record<string, unknown>;
    const authMethod =
      typeof values?.authMethod === 'string' ? values.authMethod : 'password';
    const username =
      typeof values?.username === 'string' ? values.username : '';

    if (authMethod === 'passkey') {
      return handlePasskeySignup(username);
    }

    return handlePasswordSignup(data);
  };

  const handlePasswordSignup: FormSubmitHandler = async (data) => {
    const result = await signup(data);

    return {
      success: false,
      formErrors: result.error ? [result.error] : [],
    };
  };

  const handlePasskeySignup = async (
    username: string,
  ): Promise<FormSubmissionResult> => {
    if (!username) {
      return {
        success: false,
        formErrors: ['Username is required'],
      };
    }

    setPasskeyError(null);
    setPasskeyLoading(true);

    try {
      // Step 1: Generate registration options (no session created yet)
      const { error: genError, data: regData } =
        await generateSignupRegistrationOptions(username);
      if (genError || !regData) {
        setPasskeyLoading(false);
        return {
          success: false,
          formErrors: [genError ?? 'Failed to start passkey registration'],
        };
      }

      // Step 2: OS passkey popup (still no session)
      const credential = await startRegistration({
        optionsJSON: regData.options,
      });

      // Step 3: Atomic signup — creates user + stores passkey + session
      const result = await signupWithPasskey({ username, credential });

      if (result.error) {
        setPasskeyLoading(false);
        return {
          success: false,
          formErrors: [result.error],
        };
      }

      // Session now exists — navigate to next step
      router.refresh();
      router.push('/setup?step=2');
      return { success: true };
    } catch (e) {
      if (e instanceof Error && e.name === 'NotAllowedError') {
        setPasskeyLoading(false);
        return { success: false };
      }
      setPasskeyLoading(false);
      return {
        success: false,
        formErrors: ['Passkey registration failed'],
      };
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="flex flex-col">
      <Field
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
      {showAuthMethodChoice && (
        <Field
          name="authMethod"
          label="Authentication method"
          component={RichSelectGroupField}
          initialValue="passkey"
          options={[
            {
              label: 'Passkey',
              value: 'passkey',
              description:
                'Use biometrics or your device security to sign in. No password to remember — the most secure option.',
            },
            {
              label: 'Password',
              value: 'password',
              description:
                'Traditional username and password. Requires a strong password.',
            },
          ]}
        />
      )}
      <FieldGroup
        watch={['authMethod']}
        condition={(values) => values.authMethod !== 'passkey'}
      >
        <Field
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
            name="confirmPassword"
            label="Confirm password"
            placeholder="******************"
            sameAs="password"
            component={InputField}
            type="password"
            autoComplete="do-not-autofill"
          />
        </FieldGroup>
      </FieldGroup>
      {passkeyError && (
        <p className="text-destructive text-sm">{passkeyError}</p>
      )}
      <SubmitButton className="mt-6" disabled={passkeyLoading}>
        Create account
      </SubmitButton>
    </Form>
  );
};
