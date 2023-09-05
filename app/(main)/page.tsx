import { InterviewsTable } from '~/app/(main)/_components/InterviewsTable/InterviewsTable';
import { ProtocolsTable } from '~/app/(main)/_components/ProtocolsTable/ProtocolsTable';
import { ParticipantsTable } from '~/app/(main)/_components/ParticipantsTable/ParticipantsTable';
import { Uploader } from './_components/ProtocolUploader';

export default function Home() {
  return (
    <main className="flex flex-col gap-10 p-10">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Welcome</h1>
        <p>This is the main dashboard.</p>
      </div>
      <div className="rounded-lg bg-white p-6">
        <h2 className="mb-6 text-2xl font-bold">Interviews</h2>
        <InterviewsTable />
      </div>
      <div className="rounded-lg bg-white p-6">
        <h2 className="mb-6 text-2xl font-bold">Protocols</h2>
        <ProtocolsTable />
        <Uploader />
      </div>
      <div className="rounded-lg bg-white p-6">
        <h2 className="mb-6 text-2xl font-bold">Participants</h2>
        <ParticipantsTable />
      </div>
    </main>
  );
}
