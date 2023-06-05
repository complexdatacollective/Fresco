"use client";

import { useInterview } from "~/contexts/NetworkProvider";
import { Stage } from "~/lib/shared-consts";
import Button from "~/ui/components/Button";

const Stage = ({ stageConfig }: { stageConfig: Stage }) => {
  const { network, addNode } = useInterview();

  return (
    <>
      <div className="grid w-full grid-cols-2 gap-10">
        <div>
          <pre className="h-[400px]">
            <code>{JSON.stringify(stageConfig, null, 2)}</code>
          </pre>
        </div>
        <div>
          <pre className="h-[400px]">
            <code>{JSON.stringify(network, null, 2)}</code>
          </pre>
        </div>
      </div>
      <div>
        <Button onClick={() => addNode({ id: "1", label: "test" })}>
          Add Node
        </Button>
      </div>
    </>
  );
};

export default Stage;
