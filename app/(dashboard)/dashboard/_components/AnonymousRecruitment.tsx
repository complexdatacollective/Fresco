import { api } from '~/trpc/server';
import AnonymousRecruitmentSwitch from './AnonymousRecruitmentSwitch';

const AnonymousRecruitment = async () => {
  try {
    const allowAnonymousRecruitment =
      await api.appSettings.get.allowAnonymousRecruitment.query(undefined, {
        context: {
          revalidate: 0,
        },
      });

    return (
      <AnonymousRecruitmentSwitch initialData={allowAnonymousRecruitment} />
    );
  } catch (error) {
    throw new Error(
      'An error occurred while fetching allowAnonymousRecruitment',
    );
  }
};

export default AnonymousRecruitment;
