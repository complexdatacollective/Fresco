import { api } from '~/trpc/server';
import Switch from './Switch';
import 'server-only';

const AnonymousRecruitmentSwitch = async () => {
  let appSettings;
  try {
    appSettings = await api.appSettings.get.query();
  } catch (error) {
    throw new Error(error as string, { cause: error });
  }
  return (
    <Switch
      allowAnonymousRecruitment={!!appSettings?.allowAnonymousRecruitment}
    />
  );
};

export default AnonymousRecruitmentSwitch;
