import InterviewCard from "~/components/InterviewCard";
import { prisma } from '~/utils/db';
import { useTranslation } from '../../i18n'

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

export default async function Home({ params: { lng }}) {
  const interviews = await getInterviews();
  const { t } = await useTranslation(lng);
  return (
    <main>
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p>This is the main dashboard.</p>
      <h2 className="text-2xl font-bold">Interviews</h2>
      {interviews.map((interview) => (
        <InterviewCard key={interview.id} interview={interview} />
      ))}
    </main>
  );
}
