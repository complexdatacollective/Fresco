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

  const { data: isActive } = api.protocol.getActive.useQuery(hash, {
    initialData,
    onError: (err) => {
      throw new Error(err.message);
    },
  });

  const { mutateAsync: setActive } = api.protocol.setActive.useMutation({
    async onMutate(variables) {
      const { input: newState, hash } = variables;
      await utils.protocol.getActive.cancel();

      const previousState = utils.protocol.getActive.getData();

      if (hash) {
        utils.protocol.getActive.setData(hash, newState);
      }

      return previousState;
    },
    onError: (err, _newState, previousState) => {
      utils.protocol.getActive.setData(hash, previousState);
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
