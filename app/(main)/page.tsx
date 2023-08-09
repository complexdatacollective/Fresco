import InterviewCard from "~/components/InterviewCard";
import ProtocolCard from "~/components/ProtocolCard";
import { Typography } from "~/components/Typography";
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
      <Typography variant="h1">Welcome</Typography>
      <Typography variant="body">This is the main dashboard</Typography>
      <Typography variant="h2">Interviews</Typography>
      {interviews.map((interview) => (
        <InterviewCard key={interview.id} interview={interview} />
      ))}
      <Typography variant="h2">Protocols</Typography>
      {protocols.map((protocol) => (
        <ProtocolCard key={protocol.id} protocol={protocol} />
      ))}
    </main>
  );
}
