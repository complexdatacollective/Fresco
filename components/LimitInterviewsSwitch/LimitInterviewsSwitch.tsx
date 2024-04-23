import 'server-only';
import Switch from './Switch';
import { unstable_noStore } from 'next/cache';
import { prisma } from '~/utils/db';

async function getLimitInterviewsStatus() {
  unstable_noStore();

  const appSettings = await prisma.appSettings.findFirst({
    select: {
      limitInterviews: true,
    },
  });

  return !!appSettings?.limitInterviews;
}

const LimitInterviewsSwitch = async () => {
  const limitInterviews = await getLimitInterviewsStatus();

  return <Switch limitInterviews={limitInterviews} />;
};

export default LimitInterviewsSwitch;
