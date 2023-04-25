import { type NextPage } from "next";
import Head from "next/head";
import { signIn, signOut, useSession } from "next-auth/react";
import Button from "~/ui/components/Button";
import { api } from "~/utils/api";
import { BusIcon, Eraser, Hammer } from "lucide-react";
import { Baby } from "lucide-react";

const Home: NextPage = () => {
  const hello = api.example.hello.useQuery({ text: "from tRPC" });
  const users = api.example.getAll.useQuery();

  console.log("users", users.data);
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
          <div className="">
            <Button size="small">Small without icon</Button>
            <Button icon={Eraser} size="small">
              Small Button
            </Button>
            <Button size="medium" icon={BusIcon}>
              Medium Button
            </Button>
            <Button iconPosition="right" icon={Baby}>
              Icon Position
            </Button>
            <Button color="secondary">Secondary Button</Button>
            <Button size="large" icon={Hammer}>
              Large Button
            </Button>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-2xl">
              {hello.data ? hello.data.greeting : "Loading tRPC query..."}
            </p>
            <AuthShowcase />
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();

  const { data: secretMessage } = api.example.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: sessionData?.user !== undefined }
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {secretMessage && <span> - {secretMessage}</span>}
      </p>
      <Button
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </Button>
    </div>
  );
};
