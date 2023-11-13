'use client';

import { useRouter } from 'next/navigation';
import { api } from '~/trpc/client';
import { Switch } from '~/components/ui/switch';

const ActiveProtocolSwitch = ({
  initialData,
  hash,
}: {
  initialData: boolean;
  hash: string;
}) => {
  const utils = api.useUtils();
  const router = useRouter();

  const { data: isActive } = api.protocol.active.is.useQuery(hash, {
    initialData,
    refetchOnMount: false,
    onError: (err) => {
      throw new Error(err.message);
    },
  });

  const { mutateAsync: setActive } = api.protocol.active.set.useMutation({
    async onMutate(variables) {
      const { input: newState } = variables;

      await utils.protocol.active.get.cancel();
      const previous = utils.protocol.active.get.getData();

      if (previous) {
        utils.protocol.active.get.setData(undefined, {
          ...previous,
          active: newState,
        });

        return previous;
      }
    },
    onError: (err, _newState, previousState) => {
      utils.protocol.active.get.setData(undefined, previousState);
      throw new Error(err.message);
    },
    onSuccess: () => {
      router.refresh();
    },
  });

  const handleCheckedChange = async () => {
    await setActive({ input: !isActive, hash });
  };

  return (
    <Switch
      checked={isActive}
      onCheckedChange={() => void handleCheckedChange()}
    />
  );
};
export default ActiveProtocolSwitch;
