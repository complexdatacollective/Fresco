import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useDragSource } from '~/lib/dnd';
import NodeBin from '~/lib/interviewer/components/NodeBin';
import { Node } from '~/lib/ui/components';
import { useFamilyTreeStore } from '../FamilyTreeProvider';
import ChildConnector from '../components/ChildConnector';
import ExPartnerConnector from '../components/ExPartnerConnector';
import OffspringConnector from '../components/OffspringConnector';
import PartnerConnector from '../components/PartnerConnector';

function FamilyTreeNode(props: {
  label: string;
  allowDrag: boolean;
  x: number;
  y: number;
}) {
  const { label, allowDrag, x, y } = props;

  const { dragProps } = useDragSource({
    type: 'node',
    metadata: { itemType: 'FAMILY_TREE_NODE' },
    announcedName: label,
    disabled: !allowDrag,
  });
  return (
    <div
      {...dragProps}
      className="absolute flex h-[180px] w-[180px] transform flex-col items-center gap-2 text-center"
      style={{ translate: `${x}px ${y}px` }}
    >
      <Node color="node-color-seq-1" size="xs" label="" />
      <div className="flex flex-col gap-0.5">
        <h4>{label}</h4>
        <h5>{label}</h5>
      </div>
    </div>
  );
}

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

  // const connectorElements = useMemo(() => {
  //   const elements: JSX.Element[] = [];
  //   let keyCounter = 0;

  //   for (const node of positionedNodes) {
  //     // Partner connectors
  //     if (node.partnerId != null) {
  //       elements.push(
  //         <PartnerConnector
  //           key={keyCounter++}
  //           xStartPos={(node.x ?? 0) + 10 + xOffset}
  //           xEndPos={
  //             (familyTreeNodesById[node.partnerId]?.x ?? 0) - 20 + xOffset
  //           }
  //           yPos={node.y + yOffset}
  //         />,
  //       );

  //       // Partner offspring connector
  //       if ((node.childIds?.length ?? 0) > 0) {
  //         elements.push(
  //           <OffspringConnector
  //             key={keyCounter++}
  //             xPos={
  //               ((node.x ?? 0) +
  //                 (familyTreeNodesById[node.partnerId]?.x ?? 0)) /
  //                 2 +
  //               xOffset
  //             }
  //             yStartPos={(node.y ?? 0) + yOffset}
  //             yEndPos={(node.y ?? 0) + rowHeight / 3 + 30 + yOffset}
  //           />,
  //         );
  //       }

  //       // Partner child connectors
  //       if (
  //         familyTreeNodesById[node.partnerId] != null &&
  //         node.childIds.length > 0
  //       ) {
  //         for (const child of node.childIds) {
  //           const childNode = familyTreeNodesById[child];
  //           elements.push(
  //             <ChildConnector
  //               key={keyCounter++}
  //               xStartPos={(childNode.x ?? 0) + xOffset}
  //               xEndPos={
  //                 ((node.x ?? 0) +
  //                   (familyTreeNodesById[node.partnerId]?.x ?? 0)) /
  //                   2 +
  //                 xOffset
  //               }
  //               yPos={(childNode.y ?? 0) - rowHeight / 3 - 15 + yOffset}
  //               height={rowHeight / 3 - 15}
  //             />,
  //           );
  //         }
  //       }
  //     }

  //     // Ex-partner connectors
  //     if (node.exPartnerId != null) {
  //       elements.push(
  //         <ExPartnerConnector
  //           key={keyCounter++}
  //           xStartPos={(node.x ?? 0) + 10 + xOffset}
  //           xEndPos={
  //             (familyTreeNodesById[node.exPartnerId]?.x ?? 0) - 20 + xOffset
  //           }
  //           yPos={node.y + yOffset}
  //         />,
  //       );

  //       // Ex-partner offspring connector
  //       if ((node.childIds?.length ?? 0) > 0) {
  //         elements.push(
  //           <OffspringConnector
  //             key={keyCounter++}
  //             xPos={
  //               ((node.x ?? 0) +
  //                 (familyTreeNodesById[node.exPartnerId]?.x ?? 0)) /
  //                 2 +
  //               xOffset
  //             }
  //             yStartPos={(node.y ?? 0) - 5 + yOffset}
  //             yEndPos={(node.y ?? 0) + rowHeight / 3 + 30 + yOffset}
  //           />,
  //         );
  //       }

  //       // Ex-partner child connectors
  //       if (
  //         familyTreeNodesById[node.exPartnerId] != null &&
  //         node.childIds.length > 0
  //       ) {
  //         for (const child of node.childIds) {
  //           const childNode = familyTreeNodesById[child];
  //           elements.push(
  //             <ChildConnector
  //               key={keyCounter++}
  //               xStartPos={(childNode.x ?? 0) + xOffset}
  //               xEndPos={
  //                 ((node.x ?? 0) +
  //                   (familyTreeNodesById[node.exPartnerId]?.x ?? 0)) /
  //                   2 +
  //                 xOffset
  //               }
  //               yPos={(childNode.y ?? 0) - rowHeight / 3 - 15 + yOffset}
  //               height={rowHeight / 3 - 15}
  //             />,
  //           );
  //         }
  //       }
  //     }
  //   }

  //   return elements;
  // }, [positionedNodes, familyTreeNodesById, xOffset, yOffset, rowHeight]);

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
        <div className="edge-layout">
          {edges.map((edge) => {
            if (edge.relationship === 'partner') {
              return (
                <PartnerConnector
                  key={edge.id}
                  xStartPos={(positionedNodesMap.get(edge.source)?.x ?? 0) + 10}
                  xEndPos={(positionedNodesMap.get(edge.target)?.x ?? 0) - 20}
                  yPos={positionedNodesMap.get(edge.source)?.y ?? 0}
                />
              );
            } else if (edge.relationship === 'exPartner') {
              return (
                <ExPartnerConnector
                  key={edge.id}
                  xStartPos={(positionedNodesMap.get(edge.source)?.x ?? 0) + 10}
                  xEndPos={(positionedNodesMap.get(edge.target)?.x ?? 0) - 20}
                  yPos={positionedNodesMap.get(edge.source)?.y ?? 0}
                />
              );
            } else if (edge.relationship === 'offspring') {
              return (
                <OffspringConnector
                  key={edge.id}
                  xPos={
                    ((positionedNodesMap.get(edge.source)?.x ?? 0) +
                      (positionedNodesMap.get(edge.target)?.x ?? 0)) /
                    2
                  }
                  yStartPos={(positionedNodesMap.get(edge.source)?.y ?? 0) - 5}
                  yEndPos={(positionedNodesMap.get(edge.source)?.y ?? 0) + 100}
                />
              );
            } else if (edge.relationship === 'child') {
              return (
                <ChildConnector
                  key={edge.id}
                  xStartPos={positionedNodesMap.get(edge.source)?.x ?? 0}
                  xEndPos={
                    ((positionedNodesMap.get(edge.source)?.x ?? 0) +
                      (positionedNodesMap.get(edge.target)?.x ?? 0)) /
                    2
                  }
                  yPos={(positionedNodesMap.get(edge.target)?.y ?? 0) - 115}
                  height={100}
                />
              );
            }
          })}
        </div>
        <div className="relative h-full w-full">
          {positionedNodes.map((node) => (
            <FamilyTreeNode
              key={node.label}
              label={node.label}
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
