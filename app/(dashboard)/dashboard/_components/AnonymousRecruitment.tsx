import { trpc } from '~/app/_trpc/server';
import AnonymousRecruitmentSwitch from './AnonymousRecruitmentSwitch';

const AnonymousRecruitment = async () => {
  const allowAnonymousRecruitment =
    await trpc.appSettings.get.allowAnonymousRecruitment.query(undefined, {
      context: {
        revalidate: 0,
      },
    });

  return <AnonymousRecruitmentSwitch initialData={allowAnonymousRecruitment} />;
};

export default AnonymousRecruitment;
