import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import NodeBin from '~/lib/interviewer/components/NodeBin';
import { useFamilyTreeStore } from '../FamilyTreeProvider';
import FamilyTreeNode from '../components/FamilyTreeNode';

export const FamilyTreeShells = () => {
  const step2CensusForm = {
    fields: [],
    title: 'Add Relative',
  };

  const positionedNodesMap = useFamilyTreeStore(
    useShallow((state) => state.network.nodes),
  );

  const positionedNodes = useMemo(
    () =>
      Array.from(positionedNodesMap).map(([id, node]) => {
        return { id, ...node };
      }),
    [positionedNodesMap],
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
        <div className="edge-layout"></div>
        <div className="relative h-full w-full">
          {positionedNodes.map((node) => (
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
