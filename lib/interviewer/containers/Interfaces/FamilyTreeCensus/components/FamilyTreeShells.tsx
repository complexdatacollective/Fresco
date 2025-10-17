import { type Stage } from '@codaco/protocol-validation';
import type {
  EntityAttributesProperty,
  EntityPrimaryKey,
  NcNode,
  VariableValue,
} from '@codaco/shared-consts';
import { useCallback, useState } from 'react';
import { type Node } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/store';
import { updateNode as updateNetworkNode } from '~/lib/interviewer/ducks/modules/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import { useFamilyTreeStore } from '../FamilyTreeProvider';
import AddFamilyMemberForm from './AddFamilyMemberForm';
import { CensusForm } from './CensusForm';
import EdgeRenderer from './EdgeRenderer';
import FamilyTreeNode from './FamilyTreeNode';
import FamilyTreeNodeForm from './FamilyTreeNodeForm';

export const FamilyTreeShells = (props: {
  stage: Extract<Stage, { type: 'FamilyTreeCensus' }>,
  diseaseVariable: string | null,
  stepIndex: number,
}) => {
  const { stage, diseaseVariable, stepIndex } = props;
  const nodesMap = useFamilyTreeStore((state) => state.network.nodes);
  const nodes = Array.from(
    nodesMap.entries().map(([id, node]) => ({ id, ...node })),
  );
  const [selectedNode, setSelectedNode] = useState<Node | void>(undefined);

  const dispatch = useAppDispatch();
  const updateShellNode = useFamilyTreeStore((state) => state.updateNode);
  const updateNode = useCallback(
    (payload: {
      nodeId: NcNode[EntityPrimaryKey];
      newAttributeData: NcNode[EntityAttributesProperty];
      diseaseValue: boolean;
    }) => {
      if (diseaseVariable) {
        const shellDiseases = new Map<string, boolean>([[diseaseVariable, payload.diseaseValue]])
        void dispatch(updateNetworkNode(payload)).then(() => {
          updateShellNode(payload.nodeId, { diseases: shellDiseases });
        });
      }
    },
    [diseaseVariable, dispatch, updateShellNode],
  );

  return (
    <>
      {stepIndex === 0 && <AddFamilyMemberForm />}
      {stepIndex === 1 && (
        <FamilyTreeNodeForm
          nodeType={stage.subject.type}
          selectedNode={selectedNode}
          form={stage.nameGenerationStep.form}
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
              allowDrag={node.readOnly !== true && stepIndex === 0}
              interviewNetworkId={node.interviewNetworkId}
              shape={node.sex === 'female' ? 'circle' : 'square'}
              x={node.x ?? 0}
              y={node.y ?? 0}
              selected={node.interviewNetworkId != null && typeof diseaseVariable === 'string' && node.diseases?.get(diseaseVariable)}
              handleClick={() => {
                if (stepIndex === 0) return;
                setSelectedNode(node);
                if (node.interviewNetworkId && diseaseVariable) {
                  const diseaseValue = !node.diseases?.get(diseaseVariable);
                  const diseaseData: Record<string, VariableValue> = {
                    [diseaseVariable]: diseaseValue,
                  };
                  updateNode({
                    nodeId: node.id,
                    newAttributeData: diseaseData,
                    diseaseValue: diseaseValue
                  });
                }
              }}
            />
          ))}
        </div>
      </div>
      <CensusForm />
    </>
  );
};
