import { type NextPage } from "next";
import Head from "next/head";
import { signIn, signOut, useSession } from "next-auth/react";
import Button from "~/ui/components/Button";
import { api } from "~/utils/api";

const Home: NextPage = () => {
  const hello = api.example.hello.useQuery({ text: "from tRPC" });
  return (
    <>
      <Head>
        <title>Network Canvas Fresco</title>
        <meta
          name="description"
          content="Conduct Network Canvas Interviews on the web"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Fresco T3
          </h1>
          <div className="flex flex-col items-center gap-2">
            <p className="text-2xl">
              {hello.data ? hello.data.greeting : "Loading tRPC query..."}
            </p>
            <Auth />
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;

const Auth: React.FC = () => {
  const { data: sessionData } = useSession();
  console.log("sessionData", sessionData);

  const {
    data: secretMessage,
    isError: secretMessageError,
    error: secretMessageErrorText,
  } = api.example.getSecretMessage.useQuery(
    undefined // no input
    // { enabled: sessionData?.user !== undefined }
  );

  const {
    data: secretAdminMessage,
    isError: adminMessageError,
    error: adminMessageErrorText,
  } = api.example.getAdminMessage.useQuery(
    undefined // no input
    // { enabled: sessionData?.user !== undefined }
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl">
        {sessionData && <span>Logged in as {sessionData.user.name}.</span>}
      </p>
      <p>
        {secretMessageError && (
          <span className="text-red-500">
            Error fetching secret message: {secretMessageErrorText.message}
          </span>
        )}
        {secretMessage && (
          <span className="text-green-500">
            Secret message: {secretMessage}
          </span>
        )}
      </p>
      <p>
        {adminMessageError && (
          <span className="text-red-500">
            Error fetching admin message: {adminMessageErrorText.message}
          </span>
        )}
        {secretAdminMessage && (
          <span className="text-green-500">
            Admin secret message: {secretAdminMessage}
          </span>
        )}
      </p>
      <Button
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </Button>
    </div>
  );
};
