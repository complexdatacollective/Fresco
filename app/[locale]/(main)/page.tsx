import { prisma } from "~/utils/db";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations('Home');
  return (
    <main>
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p>{t('description')}</p>
      <h2 className="text-2xl font-bold">{t('subtitle')}</h2>
      {interviews.map((interview) => (
        <InterviewCard key={interview.id} interview={interview} />
      ))}
    </main>
  );
}
