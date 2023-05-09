"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { verifyRole } from "~/app/(onboard)/signup/_actions";

const ClientProtectPage = () => {
  const { data: session } = useSession({
    required: true,
  });

  const [access, setAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {

    const doVerification = async (email: string) => {
      const hasAccess = await verifyRole(email);
  
      if (!hasAccess) {
        console.log('no access granted within func');
        setAccess(false);
        setIsLoading(false);
        return;
      }
  
      console.log('access granted');
      setIsLoading(false);
      setAccess(true);
    };

    doVerification(session?.user?.email)
    .catch((error) => {
      console.log(error);
    });
  });

  if (!access && !isLoading) {
    console.log('redirecting');
    return (
      <section className="container">
        <h1 className="text-2xl font-bold">
          This is a <span className="text-emerald-400">client-side</span>{" "}
          protected page
        </h1>
        <h2 className="mt-4 font-medium">You do not have acceess</h2>
      </section>
    );
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
