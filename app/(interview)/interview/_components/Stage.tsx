'use client';

import { useInterview } from '~/providers/InterviewProvider';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { Button } from '~/components/ui/Button';
import { v4 as uuid } from 'uuid';

const Stage = () => {
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
    <>
      <div className="grid h-[500px] grid-cols-2 gap-10">
        <pre className="flex basis-1/2 overflow-scroll rounded-lg bg-white p-6">
          {/* <code>{JSON.stringify(stageConfig, null, 2)}</code> */}
        </pre>
        <pre className="flex basis-1/2 overflow-scroll rounded-lg bg-white p-6">
          <code>{JSON.stringify(network, null, 2)}</code>
        </pre>
      </div>
      <div>
        <Button
          onClick={() =>
            addNode({
              [entityPrimaryKeyProperty]: uuid(),
              type: 'person',
              [entityAttributesProperty]: {
                label: 'New Node',
              },
            })
          }
        >
          Add Node
        </Button>
      </div>
    </>
  );
};

export default Stage;
