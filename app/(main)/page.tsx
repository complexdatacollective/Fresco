import InterviewCard from "~/components/InterviewCard";
import ProtocolCard from "~/components/ProtocolCard";
import { prisma } from "~/utils/db";

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

export default async function Home() {
  const interviews = await getInterviews();
  const protocols = await getProtocols();
  return (
    <main>
      <h1 className="text-3xl font-bold">Welcome</h1>
      <p>This is the main dashboard.</p>
      <h2 className="m-2 text-2xl font-bold">Interviews</h2>
      {interviews.map((interview) => (
        <InterviewCard key={interview.id} interview={interview} />
      ))}
      <h2 className="m-2 text-2xl font-bold">Protocols</h2>
      {protocols.map((protocol) => (
        <ProtocolCard key={protocol.id} protocol={protocol} />
      ))}
    </main>
  );
}
