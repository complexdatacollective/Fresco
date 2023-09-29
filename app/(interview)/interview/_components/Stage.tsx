'use client';

import { useInterview } from '~/providers/NetworkProvider';
import { Stage } from '~/lib/shared-consts';
import Button from '@codaco/ui/lib/components/Button';
import { v4 as uuid } from 'uuid';

const Stage = ({ stageConfig }: { stageConfig: Stage }) => {
  const { network, addNode } = useInterview();

  /**
   * This is where the we render stages from the existing app, using the stage config
   * and the network context.
   *
   * We need to use the stageConfig.type to fetch the correct stage component and
   * render it.
   *
   * For now this component just outputs the current stageConfig and the network,
   * and shows an example of using the book to add a new node.
   */

  return (
    <div className="flex grow flex-col ">
      <div className="flex h-[500px] grow flex-row gap-10">
        <pre className="flex basis-1/2 rounded-lg bg-white p-6">
          <code>{JSON.stringify(stageConfig, null, 2)}</code>
        </pre>
        <pre className="flex basis-1/2 rounded-lg bg-white p-6">
          <code>{JSON.stringify(network, null, 2)}</code>
        </pre>
      </div>
      <div>
        <Button onClick={() => addNode({ id: uuid(), label: 'test' })}>
          Add Node
        </Button>
      </div>
    </div>
  );
};

export default Stage;
