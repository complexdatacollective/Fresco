import { api } from '~/trpc/server';
import AnonymousRecruitmentSwitch from './AnonymousRecruitmentSwitch';

const AnonymousRecruitment = async () => {
  const allowAnonymousRecruitment =
    await api.appSettings.get.allowAnonymousRecruitment.query(undefined, {
      context: {
        revalidate: 0,
      },
    });

  return <AnonymousRecruitmentSwitch initialData={allowAnonymousRecruitment} />;
};

export default AnonymousRecruitment;
