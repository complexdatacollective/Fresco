"use client";

import { signIn } from "next-auth/react";
import Link from "~/components/Link";
import { Button } from "~/components/ui/Button";

const doSignIn = async (e: FormData) => {
  await signIn("credentials", {
    email: e.get("email"),
    password: e.get("password"),
  });
};

export default function SignInForm() {
  return (
    <div className="flex flex-col rounded-lg bg-white shadow-lg">
      <div className="m-6">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p>
          Don&apos;t have an account? <Link href="/signup">Sign up</Link>.
        </p>
      </div>
      <div className="m-6 flex flex-col">
        <form
          action={(e) => {
            void doSignIn(e);
          }}
        >
          <div className="mb-6 flex flex-col md:mb-0">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700">
              E-mail
            </label>
            <input
              name="email"
              type="email"
              className="mb-3 block appearance-none rounded border border-gray-200 bg-gray-200 px-4 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none"
            />
          </div>
          <div className="mb-6 flex flex-col md:mb-0">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-700">
              Password
            </label>
            <input
              name="password"
              type="password"
              className="mb-3 block appearance-none rounded border border-gray-200 bg-gray-200 px-4 py-3 leading-tight text-gray-700 focus:bg-white focus:outline-none"
            />
          </div>
          <div className="mb-6 md:mb-0">
            <Button type="submit">Sign in</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
