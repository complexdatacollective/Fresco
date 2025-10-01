import { useFamilyTreeStore } from '../FamilyTreeProvider';
import EdgeRenderer from '../components/EdgeRenderer';
import FamilyTreeNode from '../components/FamilyTreeNode';

export const FamilyTreeShells = () => {
  const step2CensusForm = {
    fields: [],
    title: 'Add Relative',
  };

  const getNodesArray = useFamilyTreeStore((state) => state.getNodesAsArray);
  const nodes = getNodesArray();

  return (
    <>
      {/* <AddFamilyMemberForm
        selectedNode={null}
        form={step2CensusForm}
        disabled={false}
        onClose={function (): void {}}
        setPlaceholderNodes={setPlaceholderNodesBulk}
        egoNodeId={egoNodeId}
      /> */}
      <div className="census-node-canvas relative h-full w-full overflow-x-auto">
        <div className="relative h-full w-full">
          <EdgeRenderer />
          {nodes.map((node) => (
            <FamilyTreeNode
              key={node.id}
              label={node.label}
              shape={node.gender === 'female' ? 'circle' : 'square'}
              allowDrag={true}
              x={node.x ?? 0}
              y={node.y ?? 0}
            />
          ))}
        </div>
      </div>
    </>
  );
};
