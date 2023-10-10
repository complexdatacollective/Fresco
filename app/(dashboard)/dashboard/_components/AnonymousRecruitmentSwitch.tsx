'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '~/app/_trpc/client';
import { Switch } from '~/components/ui/switch';

const AnonymousRecruitmentSwitch = ({
  initialData,
}: {
  initialData: boolean;
}) => {
  const utils = trpc.useContext();
  const router = useRouter();

  const { data: allowAnonymousRecruitment } =
    trpc.metadata.get.allowAnonymousRecruitment.useQuery(undefined, {
      initialData,
    });

  const { mutateAsync: updateAnonymousRecruitment } =
    trpc.metadata.updateAnonymousRecruitment.useMutation({
      async onMutate(newState: boolean) {
        await utils.metadata.get.allowAnonymousRecruitment.cancel();

        const previousState =
          utils.metadata.get.allowAnonymousRecruitment.getData();

        utils.metadata.get.allowAnonymousRecruitment.setData(
          undefined,
          newState,
        );

        return previousState;
      },
      onError: (err, newState, previousState) => {
        utils.metadata.get.allowAnonymousRecruitment.setData(
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
