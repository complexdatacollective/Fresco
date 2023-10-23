'use client';

import { useRouter } from 'next/navigation';
import { api } from '~/trpc/client';
import { Switch } from '~/components/ui/switch';

const AnonymousRecruitmentSwitch = ({
  initialData,
}: {
  initialData: boolean;
}) => {
  const utils = api.useContext();
  const router = useRouter();

  const { data: allowAnonymousRecruitment } =
    api.appSettings.get.allowAnonymousRecruitment.useQuery(undefined, {
      initialData,
    });

  const { mutateAsync: updateAnonymousRecruitment } =
    api.appSettings.updateAnonymousRecruitment.useMutation({
      async onMutate(newState: boolean) {
        await utils.appSettings.get.allowAnonymousRecruitment.cancel();

        const previousState =
          utils.appSettings.get.allowAnonymousRecruitment.getData();

        utils.appSettings.get.allowAnonymousRecruitment.setData(
          undefined,
          newState,
        );

        return previousState;
      },
      onError: (err, _newState, previousState) => {
        utils.appSettings.get.allowAnonymousRecruitment.setData(
          undefined,
          previousState,
        );
        // eslint-disable-next-line no-console
        console.error(err);
      },
      onSuccess: () => {
        router.refresh(); // This causes the server component to provide the correct value on initial render
      },
    });

  const handleCheckedChange = async () => {
    await updateAnonymousRecruitment(!allowAnonymousRecruitment);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">Anonymous Recruitment</h3>
          <p className="text-sm text-gray-600">
            Allow anonymous recruitment of participants.
          </p>
        </div>
        <Switch
          checked={allowAnonymousRecruitment}
          onCheckedChange={() => void handleCheckedChange()}
        />
      </div>
    </div>
  );
};

export default AnonymousRecruitmentSwitch;
