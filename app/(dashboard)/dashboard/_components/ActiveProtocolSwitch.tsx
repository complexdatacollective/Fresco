'use client';

import { useRouter } from 'next/navigation';
import { trpc } from '~/app/_trpc/client';
import { Switch } from '~/components/ui/switch';

const ActiveProtocolSwitch = ({
  initialData,
  hash,
}: {
  initialData: boolean;
  hash: string;
}) => {
  const utils = trpc.useContext();
  const router = useRouter();

  const { data: isActive } = trpc.protocol.getActive.useQuery(hash, {
    initialData,
  });

  const { mutateAsync: setActive } = trpc.protocol.setActive.useMutation({
    async onMutate(variables) {
      const { input: newState, hash } = variables;
      await utils.protocol.getActive.cancel();

      const previousState = utils.protocol.getActive.getData();

      if (!hash) {
        throw new Error('No hash provided');
      }

      utils.protocol.getActive.setData(hash, newState);

      return previousState;
    },
    onError: (err, _newState, previousState) => {
      utils.protocol.getActive.setData(hash, previousState);
      // eslint-disable-next-line no-console
      console.error(err);
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
