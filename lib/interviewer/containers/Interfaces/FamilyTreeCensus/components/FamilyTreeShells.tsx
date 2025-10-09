import { type Stage } from '@codaco/protocol-validation';
import { useState } from 'react';
import { type Node } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/store';
import { useFamilyTreeStore } from '../FamilyTreeProvider';
import AddFamilyMemberForm from './AddFamilyMemberForm';
import { CensusForm } from './CensusForm';
import EdgeRenderer from './EdgeRenderer';
import FamilyTreeNode from './FamilyTreeNode';
import FamilyTreeNodeForm from './FamilyTreeNodeForm';

export const FamilyTreeShells = (
  stage: Extract<Stage, { type: 'FamilyTreeCensus' }>,
) => {
  const nodesMap = useFamilyTreeStore((state) => state.network.nodes);
  const nodes = Array.from(
    nodesMap.entries().map(([id, node]) => ({ id, ...node })),
  );
  const [selectedNode, setSelectedNode] = useState<Node | void>(undefined);

  return (
    <>
      <AddFamilyMemberForm />
      {stage.stage.nameGenerationStep && (
        <FamilyTreeNodeForm
          nodeType={stage.stage.subject.type}
          selectedNode={selectedNode}
          form={stage.stage.nameGenerationStep.form}
          onClose={() => {
            setSelectedNode(undefined);
          }}
        />
      )}
      <div className="census-node-canvas relative h-full w-full overflow-x-auto">
        <div className="relative h-full w-full">
          <EdgeRenderer />
          {nodes.map((node) => (
            <FamilyTreeNode
              key={node.id}
              placeholderId={node.id}
              name={node.name}
              label={node.label}
              isEgo={node.isEgo}
              allowDrag={node.readOnly !== true}
              interviewNetworkId={node.interviewNetworkId}
              shape={node.sex === 'female' ? 'circle' : 'square'}
              x={node.x ?? 0}
              y={node.y ?? 0}
              handleClick={() => {
                setSelectedNode(node);
              }}
            />
          ))}
        </div>
      </div>
      <CensusForm />
    </>
  );
};
