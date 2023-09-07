// import { Button } from '~/components/ui/Button';
// import { InterviewsTable } from '~/app/(main)/_components/InterviewsTable/InterviewsTable';
// import { ProtocolsTable } from '~/app/(main)/_components/ProtocolsTable/ProtocolsTable';
// import { ParticipantsTable } from '~/app/(main)/_components/ParticipantsTable/ParticipantsTable';
import { redirect } from 'next/navigation';
import { getServerAuthSession } from '~/utils/auth';
import { NavigationBar } from './_components/NavigationBar';

async function Home() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect('/signin');
  }

  return (
    <>
      <NavigationBar />
      <main className="flex flex-col gap-10 p-10">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Welcome</h1>
          <p>This is the main dashboard.</p>
        </div>
        {/* <div className="rounded-lg bg-white p-6">
        <h2 className="mb-6 text-2xl font-bold">Interviews</h2>
        <InterviewsTable />
      </div>
      <div className="rounded-lg bg-white p-6">
        <h2 className="mb-6 text-2xl font-bold">Protocols</h2>
        <ProtocolsTable />
        <ProtocolUploader />
      </div>
      <div className="rounded-lg bg-white p-6">
        <h2 className="mb-6 text-2xl font-bold">Participants</h2>
        <ParticipantsTable />
      </div> */}
      </main>
    </>
  );
}

export default Home;
