import { useFamilyTreeStore } from '../FamilyTreeProvider';
import { CensusForm } from './CensusForm';
import EdgeRenderer from './EdgeRenderer';
import FamilyTreeNode from './FamilyTreeNode';

export const FamilyTreeShells = () => {
  const nodesMap = useFamilyTreeStore((state) => state.network.nodes);
  const nodes = Array.from(
    nodesMap.entries().map(([id, node]) => ({ id, ...node })),
  );

  return (
    <>
      {/* <AddFamilyMemberForm /> */}
      <div className="census-node-canvas relative h-full w-full overflow-x-auto">
        <div className="relative h-full w-full">
          <EdgeRenderer />
          {nodes.map((node) => (
            <FamilyTreeNode
              key={node.id}
              label={node.label}
              isEgo={node.isEgo}
              allowDrag={node.readOnly !== true}
              interviewNetworkId={node.interviewNetworkId}
              shape={node.sex === 'female' ? 'circle' : 'square'}
              x={node.x ?? 0}
              y={node.y ?? 0}
            />
          ))}
        </div>
      </div>
      <CensusForm />
    </>
  );
};
