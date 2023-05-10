import InterviewCard from "~/components/InterviewCard";

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

export default async function Home() {
  const interviews = await getInterviews();
  return (
    <main>
      <h1 className="text-3xl font-bold">Welcome</h1>
      <p>This is the main dashboard.</p>
      <h2 className="text-2xl font-bold">Interviews</h2>
      {interviews.map((interview) => (
        <InterviewCard key={interview.id} interview={interview} />
      ))}
    </main>
  );
}
