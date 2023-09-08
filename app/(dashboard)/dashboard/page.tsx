import { sessionGuard } from '~/utils/auth';
import { NavigationBar } from './_components/NavigationBar';
import getSetupMetadata from '~/utils/getSetupMetadata';
import SetupWizard from './_components/SetupWizard/SetupWizard';

async function Home() {
  await sessionGuard();
  const setupMetadata = await getSetupMetadata();

  return (
    <>
      <NavigationBar />
      <main className="mx-auto flex w-[80%] max-w-[1200px] flex-col gap-10 p-10">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Welcome</h1>
          <p>This is the main dashboard.</p>
        </div>
        {!setupMetadata.configured ? (
            <SetupWizard />
          ) :("")}
          
      </main>
    </>
  );
}

export default Home;
