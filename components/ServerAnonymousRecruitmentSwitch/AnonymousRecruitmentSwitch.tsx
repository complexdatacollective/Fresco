import Switch from './Switch';
import { prisma } from '~/utils/db';
import { unstable_noStore } from 'next/cache';
import 'server-only';

async function getAnonymousRecruitmentStatus() {
  unstable_noStore();

  const appSettings = await prisma.appSettings.findFirst({
    select: {
      allowAnonymousRecruitment: true,
    },
  });

  return !!appSettings?.allowAnonymousRecruitment;
}

const AnonymousRecruitmentSwitch = async () => {
  const allowAnonymousRecruitment = await getAnonymousRecruitmentStatus();
  return <Switch allowAnonymousRecruitment={allowAnonymousRecruitment} />;
};

export default AnonymousRecruitmentSwitch;
