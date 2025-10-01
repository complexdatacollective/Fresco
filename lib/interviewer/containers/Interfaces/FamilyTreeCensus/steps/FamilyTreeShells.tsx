import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import NodeBin from '~/lib/interviewer/components/NodeBin';
import { useFamilyTreeStore } from '../FamilyTreeProvider';
import FamilyTreeNode from '../components/FamilyTreeNode';
import { FAMILY_TREE_CONFIG } from '../store';

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

  let keyCounter = 0;

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
        <div className="edge-layout">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
            {edges.map(({ source, target, relationship }) => {
              const sourceNode = nodes.find((node) => node.id === source);
              const targetNode = nodes.find((node) => node.id === target);
              if (!sourceNode || !targetNode) return null;

              if (relationship === 'partner') {
                const coords = {
                  x1: targetNode.x! + FAMILY_TREE_CONFIG.nodeContainerWidth / 2,
                  y1: sourceNode.y! + FAMILY_TREE_CONFIG.nodeHeight / 2,
                  x2:
                    targetNode.x! + FAMILY_TREE_CONFIG.nodeContainerWidth * 1.5,
                  y2: targetNode.y! + FAMILY_TREE_CONFIG.nodeHeight / 2,
                };

                return (
                  <g key={keyCounter++}>
                    <line
                      x1={coords.x1}
                      y1={coords.y1 - 5}
                      x2={coords.x2}
                      y2={coords.y2 - 5}
                      stroke="#807ea1"
                    />
                    <line
                      x1={coords.x1}
                      y1={coords.y1 + 5}
                      x2={coords.x2}
                      y2={coords.y2 + 5}
                      stroke="#807ea1"
                    />
                  </g>
                );
              }
            })}
            {edges.map(({ source, target, relationship }) => {
              const sourceNode = nodes.find((node) => node.id === source);
              const targetNode = nodes.find((node) => node.id === target);
              if (!sourceNode || !targetNode) return null;

              if (relationship === 'ex-partner') {
                const coords = {
                  x1: targetNode.x! + FAMILY_TREE_CONFIG.nodeContainerWidth / 2,
                  y1: sourceNode.y! + FAMILY_TREE_CONFIG.nodeHeight / 2,
                  x2:
                    targetNode.x! + FAMILY_TREE_CONFIG.nodeContainerWidth * 1.5,
                  y2: targetNode.y! + FAMILY_TREE_CONFIG.nodeHeight / 2,
                };

                return (
                  <g key={keyCounter++}>
                    <line
                      x1={coords.x1}
                      y1={coords.y1}
                      x2={coords.x2}
                      y2={coords.y2}
                      stroke="#807ea1"
                    />
                    <line
                      x1={(coords.x1 + coords.x2) / 2}
                      y1={coords.y1 - 10}
                      x2={(coords.x1 + coords.x2) / 2 - 15}
                      y2={coords.y2 + 10}
                      stroke="#807ea1"
                    />
                    <line
                      x1={(coords.x1 + coords.x2) / 2 + 15}
                      y1={coords.y1 - 10}
                      x2={(coords.x1 + coords.x2) / 2 - 5}
                      y2={coords.y2 + 10}
                      stroke="#807ea1"
                    />
                  </g>
                );
              }
            })}
            {nodes.map((node) => {
              // Offspring connectors - draw vertical line from parent couple to children
              // Find partner and ex-partner relationships for this node
              const partnerEdges = edges.filter(
                (edge) =>
                  (edge.relationship === 'partner' ||
                    edge.relationship === 'ex-partner') &&
                  (edge.source === node.id || edge.target === node.id),
              );

              return partnerEdges.map((partnerEdge) => {
                const partnerId =
                  partnerEdge.source === node.id
                    ? partnerEdge.target
                    : partnerEdge.source;
                const partnerNode = nodes.find((n) => n.id === partnerId);
                if (!partnerNode) return null;

                // Check if this couple has shared children
                const nodeChildren = edges
                  .filter(
                    (edge) =>
                      edge.relationship === 'parent' && edge.source === node.id,
                  )
                  .map((edge) => edge.target);
                const partnerChildren = edges
                  .filter(
                    (edge) =>
                      edge.relationship === 'parent' &&
                      edge.source === partnerId,
                  )
                  .map((edge) => edge.target);
                const sharedChildren = nodeChildren.filter((child) =>
                  partnerChildren.includes(child),
                );

                if (sharedChildren.length === 0) return null;

                // Calculate midpoint between partners
                const xPos =
                  ((node.x ?? 0) + (partnerNode.x ?? 0)) / 2 +
                  FAMILY_TREE_CONFIG.partnerSpacing / 2;

                // For ex-partners, start slightly above the connector line
                const yStartPos =
                  partnerEdge.relationship === 'ex-partner'
                    ? (node.y ?? 0) + FAMILY_TREE_CONFIG.nodeHeight / 2 - 5
                    : (node.y ?? 0) + FAMILY_TREE_CONFIG.nodeHeight / 2 + 5; // Below partner connector

                const yEndPos =
                  (node.y ?? 0) + FAMILY_TREE_CONFIG.nodeContainerHeight; // Note: not row height, because child connectors take us the rest of the way

                return (
                  <line
                    key={`offspring-${node.id}-${partnerId}`}
                    x1={xPos}
                    y1={yStartPos}
                    x2={xPos}
                    y2={yEndPos}
                    stroke="#807ea1"
                  />
                );
              });
            })}
            {/* Child connectors - draw L-shaped paths from children to parent's offspring connector */}
            {nodes.map((childNode) => {
              // Find all parent edges for this child
              const parentEdges = edges.filter(
                (edge) =>
                  edge.relationship === 'parent' &&
                  edge.target === childNode.id,
              );

              if (parentEdges.length < 2) return null; // Need at least 2 parents for a connector

              const parent1 = nodes.find((n) => n.id === parentEdges[0].source);
              const parent2 = nodes.find((n) => n.id === parentEdges[1].source);
              if (!parent1 || !parent2) return null;

              // Check if parents are partners or ex-partners
              const hasPartnerRelationship = edges.some(
                (edge) =>
                  (edge.relationship === 'partner' ||
                    edge.relationship === 'ex-partner') &&
                  ((edge.source === parent1.id && edge.target === parent2.id) ||
                    (edge.target === parent1.id && edge.source === parent2.id)),
              );

              if (!hasPartnerRelationship) return null; // Parents not connected, no connector

              // Calculate positions
              const xStartPos =
                (childNode.x ?? 0) + FAMILY_TREE_CONFIG.nodeContainerWidth / 2; // Center of child node
              const xEndPos =
                ((parent1.x ?? 0) + (parent2.x ?? 0)) / 2 +
                FAMILY_TREE_CONFIG.partnerSpacing / 2;
              const yPos = (childNode.y ?? 0) - FAMILY_TREE_CONFIG.padding;
              const height =
                FAMILY_TREE_CONFIG.nodeHeight / 2 +
                FAMILY_TREE_CONFIG.padding -
                5;

              return (
                <g key={`child-connector-${childNode.id}`}>
                  {/* Vertical line from child upward */}
                  <line
                    x1={xStartPos}
                    y1={yPos}
                    x2={xStartPos}
                    y2={yPos + height}
                    stroke="#807ea1"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  {/* Horizontal line to offspring connector */}
                  <line
                    x1={xStartPos}
                    y1={yPos}
                    x2={xEndPos}
                    y2={yPos}
                    stroke="#807ea1"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}
          </svg>

          {/* 
          {positionedNodes.map((node) => {
            return (
              familyTreeNodesById[node.partnerId] != null &&
              familyTreeNodesById[node.partnerId] != null &&
              node.childIds.length > 0 &&
              node.childIds.map((child) => {
                const childNode = familyTreeNodesById[child];
                return (
                  <ChildConnector
                    key={keyCounter++}
                    xStartPos={(childNode.x ?? 0) + FAMILY_TREE_CONFIG.xOffset}
                    xEndPos={
                      ((node.x ?? 0) +
                        (familyTreeNodesById[node.partnerId]?.xPos ?? 0)) /
                        2 +
                      FAMILY_TREE_CONFIG.xOffset
                    }
                    yPos={
                      (childNode.y ?? 0) -
                      FAMILY_TREE_CONFIG.rowHeight / 3 -
                      15 +
                      FAMILY_TREE_CONFIG.yOffset
                    }
                    height={FAMILY_TREE_CONFIG.rowHeight / 3 - 15}
                  />
                );
              })
            );
          })}
          {positionedNodes.map((node) => {
            return (
              familyTreeNodesById[node.exPartnerId] != null &&
              familyTreeNodesById[node.exPartnerId] != null &&
              node.childIds.length > 0 &&
              node.childIds.map((child) => {
                const childNode = familyTreeNodesById[child];
                return (
                  <ChildConnector
                    key={keyCounter++}
                    xStartPos={(childNode.x ?? 0) + FAMILY_TREE_CONFIG.xOffset}
                    xEndPos={
                      ((node.x ?? 0) +
                        (familyTreeNodesById[node.exPartnerId]?.xPos ?? 0)) /
                        2 +
                      FAMILY_TREE_CONFIG.xOffset
                    }
                    yPos={
                      (childNode.y ?? 0) -
                      FAMILY_TREE_CONFIG.rowHeight / 3 -
                      15 +
                      FAMILY_TREE_CONFIG.yOffset
                    }
                    height={FAMILY_TREE_CONFIG.rowHeight / 3 - 15}
                  />
                );
              })
            );
          })} */}
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
