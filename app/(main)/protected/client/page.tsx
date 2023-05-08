"use client";

import { useSession } from "next-auth/react";
import { verifyRole } from "~/app/(onboard)/signup/_actions";

const doVerification = async (email: string) => {
  const result = await verifyRole(email);
  
  if (!result) {
    return false;
  }
};

const ClientProtectPage = () => {
  const { data: session } = useSession({
    required: true,
  });

  const hasAccess = doVerification(session?.user?.email);
  if (!hasAccess) {
   console.log('no access');
   return (
      <div>
        <h1>Sorry, you do not have access to this page.</h1>
      </div>
   )
  };

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
