"use client";
import { SignUp } from "~/components/SignUp";

export default function Page() {
  return (
    <div className="flex w-5/12 flex-col rounded-lg bg-white p-6 shadow-lg">
      <div className="m-6">
        <h1 className="text-2xl font-bold">Sign Up</h1>
      </div>
      <SignUp />
    </div>
  );
}
