import { trpc } from '~/app/_trpc/server';
import AnonymousRecruitmentSwitch from './AnonymousRecruitmentSwitch';

const AnonymousRecruitment = async () => {
  const allowAnonymousRecruitment =
    await trpc.metadata.get.allowAnonymousRecruitment.query(undefined, {});

  return <AnonymousRecruitmentSwitch initialData={allowAnonymousRecruitment} />;
};

export default AnonymousRecruitment;