import { prisma } from '~/utils/db';
import { Switch } from './ui/switch';

const RecruitmentSwitch = async () => {
  const appSettings = await prisma.appSettings.findFirst();

  const updateAnonymousRecruitment = (value: boolean) => {
    console.log('update anon recriot', value);
  };

  return (
    <Switch
      name="allowAnonymousRecruitment"
      checked={appSettings?.allowAnonymousRecruitment}
      onCheckedChange={(value) => {
        updateAnonymousRecruitment(value);
      }}
    />
  );
};

export default RecruitmentSwitch;
