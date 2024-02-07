import 'server-only';
import { api } from '~/trpc/server';
import Switch from './Switch';

const AnonymousRecruitmentSwitch = async () => {
  const allowAnonymousRecruitment =
    await api.appSettings.getAnonymousRecruitmentStatus.query();

  return <Switch allowAnonymousRecruitment={allowAnonymousRecruitment} />;
};

export default AnonymousRecruitmentSwitch;
