"use client";

import { useSession } from "next-auth/react";

const ClientProtectPage = () => {
  const { data: session } = useSession({
    required: true,
  });

  if (!session) {
    return <div>loading...</div>;
  }

  return (
    <section className="container">
      <h1 className="text-2xl font-bold">
        This is a <span className="text-emerald-400">client-side</span>{" "}
        protected page
      </h1>
      <h2 className="mt-4 font-medium">You are logged in as:</h2>
      <p className="mt-4">{session?.user?.name}</p>
    </section>
  );
};

export default ClientProtectPage;
