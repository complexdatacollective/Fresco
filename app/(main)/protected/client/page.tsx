"use client";

import { useSession } from "next-auth/react";
import { Typography } from "~/components/Typography";

const ClientProtectPage = () => {
  const { data: session } = useSession({
    required: true,
  });

  return (
    <section className="container">
      <Typography variant="h2">
        This is a <span className="text-emerald-400">client-side</span>{" "}
        protected page
      </Typography>
      <Typography variant="body" className="mt-4">
        You are logged in as: {session?.user?.name}
      </Typography>
    </section>
  );
};

export default ClientProtectPage;
