import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import NodeBin from '~/lib/interviewer/components/NodeBin';
import { useFamilyTreeStore } from '../FamilyTreeProvider';
import EdgeRenderer from '../components/EdgeRenderer';
import FamilyTreeNode from '../components/FamilyTreeNode';

export const FamilyTreeShells = () => {
  const step2CensusForm = {
    fields: [],
    title: 'Add Relative',
  };

  const nodesMap = useFamilyTreeStore(
    useShallow((state) => state.network.nodes),
  );

  const nodes = useMemo(
    () =>
      Array.from(nodesMap).map(([id, node]) => {
        return { id, ...node };
      }),
    [nodesMap],
  );

  const edgesMap = useFamilyTreeStore((state) => state.network.edges);
  const edges = useMemo(() => Array.from(edgesMap.values()), [edgesMap]);

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
      <div className="census-node-canvas relative h-full w-full">
        <div className="relative h-full w-full">
          <EdgeRenderer edges={edges} nodes={nodes} />
          {nodes.map((node) => (
            <FamilyTreeNode
              key={node.label}
              label={node.label}
              shape={node.gender === 'female' ? 'circle' : 'square'}
              allowDrag={true}
              x={node.x ?? 0}
              y={node.y ?? 0}
            />
          ))}
        </div>
      </div>
      <NodeBin
        accepts={() => true}
        dropHandler={() => {
          console.log('dropped on bin');
        }}
        // accepts={(node: { itemType: string }) =>
        //   node.itemType === 'PLACEHOLDER_NODE'
        // }
        // dropHandler={(meta: PlaceholderNodeProps) =>
        //   removePlaceholderNode(meta.id)
        // }
      />
    </>
  );
};
