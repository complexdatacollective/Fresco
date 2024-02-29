import 'server-only';
import Switch from './Switch';

const AnonymousRecruitmentSwitch = ({
  allowAnonymousRecruitment,
}: {
  allowAnonymousRecruitment: boolean;
}) => {
  return <Switch allowAnonymousRecruitment={allowAnonymousRecruitment} />;
};

export default AnonymousRecruitmentSwitch;
