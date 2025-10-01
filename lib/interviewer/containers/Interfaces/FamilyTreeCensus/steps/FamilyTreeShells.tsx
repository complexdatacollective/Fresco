import { useFamilyTreeStore } from '../FamilyTreeProvider';
import EdgeRenderer from '../components/EdgeRenderer';
import FamilyTreeNode from '../components/FamilyTreeNode';
import { CensusForm } from './CensusForm';

export const FamilyTreeShells = () => {
  const getNodesArray = useFamilyTreeStore((state) => state.getNodesAsArray);
  const nodes = getNodesArray();

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
              interviewNetworkId={node.interviewNetworkId}
              shape={node.sex === 'female' ? 'circle' : 'square'}
              allowDrag={true}
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
