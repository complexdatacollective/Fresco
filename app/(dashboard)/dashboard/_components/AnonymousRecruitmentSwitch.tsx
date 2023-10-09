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

  const {
    mutateAsync: updateAnonymousRecruitment,
    // isLoading: isUpdatingAnonymousRecruitment,
  } = trpc.metadata.updateAnonymousRecruitment.useMutation({
    onMutate: async (newState) => {
      await utils.metadata.get.allowAnonymousRecruitment.cancel();

      utils.metadata.get.allowAnonymousRecruitment.setData(undefined, newState);
    },
    // onError: (err, newState, context) => {
    //   // todo: handle putting the visual state back to the previous state
    // },
    onSettled: async () => {
      router.refresh();
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
          onCheckedChange={handleCheckedChange}
        />
      </div>
    </div>
  );
};

export default AnonymousRecruitmentSwitch;
