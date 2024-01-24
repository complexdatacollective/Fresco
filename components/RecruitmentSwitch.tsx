'use client';

import { api } from '~/trpc/client';
import { Switch } from './ui/switch';
import { clientRevalidateTag } from '~/utils/clientRevalidate';

const RecruitmentSwitch = () => {
  const { data: appSettings, isLoading } = api.appSettings.get.useQuery(
    undefined,
    {},
  );

  const utils = api.useUtils();

  const { mutate: updateAnonymousRecruitment } =
    api.appSettings.updateAnonymousRecruitment.useMutation({
      onMutate: async (allowAnonymousRecruitment: boolean) => {
        await utils.appSettings.get.cancel();

        const appSettingsGetAll = utils.appSettings.get.getData();

        if (!appSettingsGetAll) {
          return;
        }

        utils.appSettings.get.setData(undefined, {
          ...appSettingsGetAll,
          allowAnonymousRecruitment,
        });

        return { appSettingsGetAll };
      },
      onSettled: () => {
        void utils.appSettings.get.invalidate();
        void clientRevalidateTag('appSettings.get');
      },
      onError: (_error, _allowAnonymousRecruitment, context) => {
        utils.appSettings.get.setData(undefined, context?.appSettingsGetAll);
      },
    });

  return (
    <Switch
      name="allowAnonymousRecruitment"
      disabled={isLoading}
      checked={appSettings?.allowAnonymousRecruitment}
      onCheckedChange={(value) => {
        updateAnonymousRecruitment(value);
      }}
    />
  );
};

export default RecruitmentSwitch;
