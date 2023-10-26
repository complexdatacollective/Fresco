import { api } from '~/trpc/server';
import Switch from './Switch';
import { unstable_cache } from 'next/cache';
import 'server-only';

const AnonymousRecruitmentSwitch = async () => {
  const allowAnonymousRecruitment = await unstable_cache(
    async () => await api.appSettings.get.allowAnonymousRecruitment.query(),
    ['anonymousRecruitment'],
    {
      tags: ['anonymousRecruitment'],
      revalidate: false,
    },
  )();

  return <Switch allowAnonymousRecruitment={allowAnonymousRecruitment} />;
};

export default AnonymousRecruitmentSwitch;
