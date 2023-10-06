import AnonymousRecruitmentSwitch from '~/components/AnonymousRecruitmentSwitch';
import ResetButton from './_components/ResetButton';
import { trpc } from '~/app/_trpc/server';

async function Home() {
  const allowAnonymousRecruitment =
    await trpc.metadata.get.allowAnonymousRecruitment.query();

  return (
    <>
      <main className="mx-auto flex w-[80%] max-w-[1200px] flex-col gap-10 p-10">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Welcome</h1>
          <p>This is the main dashboard.</p>
          <ResetButton />
          <AnonymousRecruitmentSwitch
            initialCheckedState={allowAnonymousRecruitment}
          />
        </div>
      </main>
    </>
  );
}

export default Home;
