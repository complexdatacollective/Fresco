"use client";

import Button from "~/ui/components/Button";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useTranslation } from "~/app/i18n/client";

// export const metadata = {
//   title: "Sign in",
//   description: "Sign in to Network Canvas.",
// };

export default function Page({ params: { lng }}) {
  const doSignIn = async (e: FormData) => {
    await signIn("credentials", {
      email: e.get("email"),
      password: e.get("password"),
      callbackUrl: "/",
    });
  };

  const { t } = useTranslation(lng, 'signIn');

  return (
    <div className="flex w-5/12 flex-col rounded-lg bg-white shadow-lg">
      <div className="m-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p>
          {t('message')}<Link href="/signup">{t('button')}</Link>.
        </p>
      </div>
      <div className="m-6 flex flex-col">
        <form action={doSignIn} className="w-full max-w-lg">
          <div className="mb-6 w-full md:mb-0">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700">
              E-mail
            </label>
            <input
              name="email"
              type="email"
              className="mb-3 block w-full appearance-none rounded border border-gray-200 bg-gray-200 px-4 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none"
            />
          </div>
          <div className="mb-6 w-full md:mb-0">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700">
              Password
            </label>
            <input
              name="password"
              type="password"
              className="mb-3 block w-full appearance-none rounded border border-gray-200 bg-gray-200 px-4 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none"
            />
          </div>
          <div className="mb-6 w-full md:mb-0">
            <Button type="submit">Sign in</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
