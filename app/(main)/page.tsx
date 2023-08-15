import InterviewCard from '~/components/InterviewCard';
import ProtocolCard from '~/components/ProtocolCard';
import { Button } from '~/components/ui/Button';
import { prisma } from '~/utils/db';
import { DataTable } from '~/components/ui/DataTable/DataTable';
import {
  InterviewColumns,
  ProtocolColumns,
  ParticipantColumns,
} from '~/components/ui/DataTable/Columns';

const getInterviews = async () => {
  const interviews = await prisma.interview.findMany({
    include: {
      user: {
        select: {
          name: true,
        },
      },
      protocol: true,
    },
  });

  return interviews;
};

const getProtocols = async () => {
  const protocols = await prisma.protocol.findMany();

  return protocols;
};

const getParticipants = async () => {
  const participants = await prisma.user.findMany({
    where: {
      roles: {
        some: {
          name: 'PARTICIPANT',
        },
      },
    },
  });
  return participants;
};

export default async function Home() {
  const interviews = await getInterviews();
  const protocols = await getProtocols();
  const participants = await getParticipants();
  return (
    <main className="flex flex-col gap-10 p-10">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Welcome</h1>
        <p>This is the main dashboard.</p>
      </div>
      <div className="rounded-lg bg-white p-6">
        <h2 className="mb-6 text-2xl font-bold">Interviews</h2>
        <div className="grid grid-cols-2">
          {interviews.map((interview) => (
            <InterviewCard key={interview.id} interview={interview} />
          ))}
        </div>
        <DataTable columns={InterviewColumns} data={interviews} />
      </div>
      <div className="rounded-lg bg-white p-6">
        <h2 className="mb-6 text-2xl font-bold">Protocols</h2>
        <div className="grid grid-cols-2">
          {protocols.map((protocol) => (
            <ProtocolCard key={protocol.id} protocol={protocol} />
          ))}
        </div>
        <DataTable columns={ProtocolColumns} data={protocols} />
        <Button className="mt-6" disabled>
          Upload Protocol
        </Button>
      </div>
      <div className="rounded-lg bg-white p-6">
        <h2 className="mb-6 text-2xl font-bold">Participants</h2>
        <DataTable columns={ParticipantColumns} data={participants} />
      </div>
    </main>
  );
}
