import { getAnonymousRecruitmentStatus } from '~/queries/appSettings';
import Switch from './Switch';

const AnonymousRecruitmentSwitch = async () => {
  const allowAnonymousRecruitment = await getAnonymousRecruitmentStatus();
  console.log('allowAnonymousRecruitment', allowAnonymousRecruitment);
  return <Switch allowAnonymousRecruitment={allowAnonymousRecruitment} />;
};

export default AnonymousRecruitmentSwitch;
