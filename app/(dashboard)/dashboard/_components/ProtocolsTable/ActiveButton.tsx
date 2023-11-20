'use client';
import { api } from '~/trpc/client';
import { BadgeCheck } from 'lucide-react';

const ActiveButton = ({
  active,
  protocolId,
}: {
  active: boolean;
  protocolId: string;
}) => {
  const utils = api.useUtils();

  const { mutateAsync: setActiveProtocol } =
    api.protocol.active.set.useMutation({
      // Optimistic update
      onMutate: async (newActiveProtocolId: string) => {
        await utils.protocol.get.all.cancel();
        await utils.protocol.active.get.cancel();

        const protocolGetAll = utils.protocol.get.all.getData();
        const protocolActiveGet = utils.protocol.active.get.getData();

        utils.protocol.active.get.setData(undefined, protocolId);
        utils.protocol.get.all.setData(
          undefined,
          (protocolGetAll) =>
            protocolGetAll?.map((protocol) => {
              if (protocol.id === newActiveProtocolId) {
                return {
                  ...protocol,
                  active: true,
                };
              }

              return {
                ...protocol,
                active: false,
              };
            }),
        );

        return { protocolGetAll, protocolActiveGet };
      },
      onSettled: () => {
        void utils.protocol.get.all.invalidate();
        void utils.protocol.active.get.invalidate();
      },
      onError: (_error, _newActiveProtocolId, context) => {
        utils.protocol.get.all.setData(undefined, context?.protocolGetAll);
        utils.protocol.active.get.setData(
          undefined,
          context?.protocolActiveGet,
        );
      },
    });

  if (active) {
    return <BadgeCheck className="fill-white text-purple-500" />;
  }

  return (
    <button
      title="Make active..."
      onClick={() => setActiveProtocol(protocolId)}
    >
      <BadgeCheck className="cursor-pointer fill-white text-primary/20 hover:scale-150 hover:fill-purple-500 hover:text-white" />
    </button>
  );
};

export default ActiveButton;
