'use client';

import { api } from '~/trpc/client';
import { Switch } from './ui/switch';
import { clientRevalidateTag } from '~/utils/clientRevalidate';

const LimitInterviewsSwitch = () => {
  const { data: appSettings, isLoading } = api.appSettings.get.useQuery(
    undefined,
    {},
  );

  const utils = api.useUtils();

  const { mutate: updateLimitInterviews } =
    api.appSettings.updateLimitInterviews.useMutation({
      onMutate: async (limitInterviews: boolean) => {
        await utils.appSettings.get.cancel();

        const appSettingsGetAll = utils.appSettings.get.getData();

        if (!appSettingsGetAll) {
          return;
        }

        utils.appSettings.get.setData(undefined, {
          ...appSettingsGetAll,
          limitInterviews,
        });

        return { appSettingsGetAll };
      },
      onSettled: () => {
        void utils.appSettings.get.invalidate();
        void clientRevalidateTag('appSettings.get');
      },
      onError: (_error, _limitInterviews, context) => {
        utils.appSettings.get.setData(undefined, context?.appSettingsGetAll);
      },
    });

  return (
    <Switch
      name="limitInterviews"
      disabled={isLoading}
      checked={appSettings?.limitInterviews}
      onCheckedChange={(value) => {
        updateLimitInterviews(value);
      }}
    />
  );
};

export default LimitInterviewsSwitch;
