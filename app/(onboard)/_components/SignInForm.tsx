'use client';

import { signIn } from 'next-auth/react';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';

const doSignIn = async (e: FormData) => {
  await signIn('credentials', {
    email: e.get('email'),
    password: e.get('password'),
  });
};

export default function SignInForm() {
  return (
    <form
      action={(e) => {
        void doSignIn(e);
      }}
    >
      <div className="mb-6 flex flex-wrap">
        <Input name="email" type="email" label="E-mail Address" />
      </div>
      <div className="mb-6 flex flex-wrap">
        <Input
          name="password"
          type="password"
          label="Password"
          autoComplete="current-password"
        />
      </div>
      <div className="flex flex-wrap">
        <Button type="submit">Sign in</Button>
      </div>
    </form>
  );
}
