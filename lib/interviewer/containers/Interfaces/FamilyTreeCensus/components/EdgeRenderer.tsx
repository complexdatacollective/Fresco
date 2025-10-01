import { type Edge, FAMILY_TREE_CONFIG, type Node } from '../store';

type EdgeRendererProps = {
  nodes: Node[];
  edges: Edge[];
};

const EDGE_WIDTH = 5;

export default function EdgeRenderer({ nodes, edges }: EdgeRendererProps) {
  let keyCounter = 0;
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute top-0 left-0 h-full w-full"
    >
      {edges.map(({ source, target, relationship }) => {
        const sourceNode = nodes.find((node) => node.id === source);
        const targetNode = nodes.find((node) => node.id === target);
        if (!sourceNode || !targetNode) return null;

        if (relationship === 'partner') {
          const coords = {
            x1: targetNode.x! + FAMILY_TREE_CONFIG.nodeContainerWidth / 2,
            y1: sourceNode.y! + FAMILY_TREE_CONFIG.nodeHeight / 2,
            x2: targetNode.x! + FAMILY_TREE_CONFIG.nodeContainerWidth * 1.5,
            y2: targetNode.y! + FAMILY_TREE_CONFIG.nodeHeight / 2,
          };

          return (
            <g key={keyCounter++}>
              <line
                x1={coords.x1}
                y1={coords.y1 - EDGE_WIDTH}
                x2={coords.x2}
                y2={coords.y2 - EDGE_WIDTH}
                stroke="#807ea1"
                strokeWidth={EDGE_WIDTH}
              />
              <line
                x1={coords.x1}
                y1={coords.y1 + EDGE_WIDTH}
                x2={coords.x2}
                y2={coords.y2 + EDGE_WIDTH}
                stroke="#807ea1"
                strokeWidth={EDGE_WIDTH}
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
            x2: targetNode.x! + FAMILY_TREE_CONFIG.nodeContainerWidth * 1.5,
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
                strokeWidth={EDGE_WIDTH}
              />
              <line
                x1={(coords.x1 + coords.x2) / 2}
                y1={coords.y1 - 10}
                x2={(coords.x1 + coords.x2) / 2 - 15}
                y2={coords.y2 + 10}
                stroke="#807ea1"
                strokeWidth={EDGE_WIDTH}
              />
              <line
                x1={(coords.x1 + coords.x2) / 2 + 15}
                y1={coords.y1 - 10}
                x2={(coords.x1 + coords.x2) / 2 - 5}
                y2={coords.y2 + 10}
                stroke="#807ea1"
                strokeWidth={EDGE_WIDTH}
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
                edge.relationship === 'parent' && edge.source === partnerId,
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
            (node.y ?? 0) +
            FAMILY_TREE_CONFIG.nodeContainerHeight +
            FAMILY_TREE_CONFIG.padding / 2; // Note: not row height, because child connectors take us the rest of the way

          return (
            <line
              key={`offspring-${node.id}-${partnerId}`}
              x1={xPos}
              y1={yStartPos}
              x2={xPos}
              y2={yEndPos}
              stroke="#807ea1"
              strokeWidth={EDGE_WIDTH}
            />
          );
        });
      })}
      {/* Child connectors - draw L-shaped paths from children to parent's offspring connector */}
      {nodes.map((childNode) => {
        // Find all parent edges for this child
        const parentEdges = edges.filter(
          (edge) =>
            edge.relationship === 'parent' && edge.target === childNode.id,
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
        const yPos = (childNode.y ?? 0) - FAMILY_TREE_CONFIG.padding / 2;
        const height =
          FAMILY_TREE_CONFIG.nodeHeight / 2 + FAMILY_TREE_CONFIG.padding - 5;

        return (
          <g key={`child-connector-${childNode.id}`}>
            {/* Vertical line from child upward */}
            <line
              x1={xStartPos}
              y1={yPos}
              x2={xStartPos}
              y2={yPos + height}
              stroke="#807ea1"
              strokeWidth={EDGE_WIDTH}
              strokeLinecap="round"
            />
            {/* Horizontal line to offspring connector */}
            <line
              x1={xStartPos}
              y1={yPos}
              x2={xEndPos}
              y2={yPos}
              stroke="#807ea1"
              strokeWidth={EDGE_WIDTH}
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
}
