import { api } from '~/trpc/server';
import Switch from './Switch';
import 'server-only';

const AnonymousRecruitmentSwitch = async () => {
  const appSettings = await api.appSettings.get.query();

  return (
    <Switch
      allowAnonymousRecruitment={!!appSettings?.allowAnonymousRecruitment}
    />
  );
};

export default AnonymousRecruitmentSwitch;
