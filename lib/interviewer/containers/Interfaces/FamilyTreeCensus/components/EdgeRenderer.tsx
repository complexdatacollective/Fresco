import { useMemo } from 'react';

type Node = {
  id: string;
  x: number;
  y: number;
  gender: 'male' | 'female';
};

type Edge = {
  id: string;
  source: string;
  target: string;
  relationship: 'parent' | 'partner';
};

type EdgeRendererProps = {
  nodes: Node[];
  edges: Edge[];
};

type PathSegment = {
  from: { x: number; y: number };
  to: { x: number; y: number };
  edgeIds: Set<string>;
  type: 'horizontal' | 'vertical';
};

const NODE_WIDTH = 150;
const NODE_HEIGHT = 150;
const NODE_VISUAL_SIZE = 60; // Size of the actual circle/square visual
const EDGE_SPACING = 4; // Spacing between bundled edges
const PARTNER_EDGE_Y_OFFSET = 3; // Y offset between parallel partner lines
const PARTNER_LINE_SPACING = 3; // Spacing between the two parallel partner lines
const GENERATION_SPACING = 200; // Vertical spacing between generations
const BEND_OFFSET = 1.2; // Multiplier for bend position (1.2 = 20% further down than halfway)

export default function EdgeRenderer({ nodes, edges }: EdgeRendererProps) {
  const nodeMap = useMemo(() => {
    const map = new Map<string, Node>();
    nodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [nodes]);

  const { partnerEdgePaths, parentChildEdgePaths } = useMemo(() => {
    const partnerPaths: string[] = [];
    const parentChildPaths: string[] = [];

    // Group edges by type
    const partnerEdges = edges.filter((e) => e.relationship === 'partner');
    const parentEdges = edges.filter((e) => e.relationship === 'parent');

    // Track partner connections to reuse them for parent edges
    const partnerConnections = new Map<
      string,
      { x1: number; x2: number; y: number }
    >();

    // Process partner edges (horizontal connections with two parallel lines)
    partnerEdges.forEach((edge) => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);

      if (!source || !target) return;

      // Determine left and right nodes
      const leftNode = source.x < target.x ? source : target;
      const rightNode = source.x < target.x ? target : source;
      const leftId = source.x < target.x ? edge.source : edge.target;
      const rightId = source.x < target.x ? edge.target : edge.source;

      // Exit from the sides of the nodes
      const leftX = leftNode.x + NODE_WIDTH / 2 + NODE_VISUAL_SIZE / 2;
      const rightX = rightNode.x + NODE_WIDTH / 2 - NODE_VISUAL_SIZE / 2;
      const centerY = leftNode.y + NODE_VISUAL_SIZE / 2;

      // Store connection info for reuse by parent edges
      const connectionKey = [leftId, rightId].sort().join('|||');
      partnerConnections.set(connectionKey, {
        x1: leftX,
        x2: rightX,
        y: centerY,
      });

      // Draw two parallel horizontal lines
      const topPath = `M ${leftX} ${centerY - PARTNER_LINE_SPACING} L ${rightX} ${centerY - PARTNER_LINE_SPACING}`;
      const bottomPath = `M ${leftX} ${centerY + PARTNER_LINE_SPACING} L ${rightX} ${centerY + PARTNER_LINE_SPACING}`;

      partnerPaths.push(topPath);
      partnerPaths.push(bottomPath);
    });

    // Group children by their parent(s)
    const childToParents = new Map<string, string[]>();

    // First pass: collect all parent-child relationships
    parentEdges.forEach((edge) => {
      if (!childToParents.has(edge.target)) {
        childToParents.set(edge.target, []);
      }
      childToParents.get(edge.target)!.push(edge.source);
    });

    // Group edges by parent pairs or single parents
    const parentGroups = new Map<string, Set<string>>();
    const processedChildren = new Set<string>();

    childToParents.forEach((parents, child) => {
      if (processedChildren.has(child)) return;

      if (parents.length === 2) {
        // Two parents - group by parent pair
        const pairKey = parents.sort().join('|||'); // Use a separator that won't appear in IDs
        if (!parentGroups.has(pairKey)) {
          parentGroups.set(pairKey, new Set());
        }
        parentGroups.get(pairKey)!.add(child);
      } else if (parents.length === 1) {
        // Single parent
        const singleKey = `single|||${parents[0]}`; // Use consistent separator
        if (!parentGroups.has(singleKey)) {
          parentGroups.set(singleKey, new Set());
        }
        parentGroups.get(singleKey)!.add(child);
      }
      processedChildren.add(child);
    });

    // Process each parent group with bundled edges
    parentGroups.forEach((childrenIds, key) => {
      if (key.startsWith('single|||')) {
        // Single parent case
        const parentId = key.replace('single|||', '');
        const parent = nodeMap.get(parentId);
        if (!parent) return;

        const parentX = parent.x + NODE_WIDTH / 2;
        const parentY = parent.y + NODE_VISUAL_SIZE / 2;

        // Sort children by X position for cleaner routing
        const children = Array.from(childrenIds)
          .map((childId) => ({
            id: childId,
            node: nodeMap.get(childId)!,
          }))
          .filter((c) => c.node)
          .sort((a, b) => a.node.x - b.node.x);

        if (children.length === 1) {
          // Single child - exit horizontally from side, then descend
          const child = children[0].node;
          const childX = child.x + NODE_WIDTH / 2;
          const childY = child.y; // Enter at top of child

          // Determine which side to exit from based on child position
          const exitSide = childX < parentX ? 'left' : 'right';
          const exitX =
            exitSide === 'left'
              ? parentX - NODE_VISUAL_SIZE / 2
              : parentX + NODE_VISUAL_SIZE / 2;

          // Extend horizontally before descending
          const extendDistance = 30;
          const extendX =
            exitSide === 'left'
              ? exitX - extendDistance
              : exitX + extendDistance;
          // First bend extends further down (60% of the way instead of 50%)
          const midY = parentY + (GENERATION_SPACING / 2) * BEND_OFFSET;

          const path = [
            `M ${exitX} ${parentY}`, // Exit from side of parent
            `L ${extendX} ${parentY}`, // Go horizontally away from node
            `L ${extendX} ${midY}`, // Go down to 60% between rows
            `L ${childX} ${midY}`, // Horizontal to child's x position
            `L ${childX} ${childY}`, // Down to enter child from top
          ].join(' ');
          parentChildPaths.push(path);
        } else {
          // Multiple children - create bus further down
          const busY = parentY + (GENERATION_SPACING / 2) * BEND_OFFSET;
          const childrenXs = children.map((c) => c.node.x + NODE_WIDTH / 2);
          const minX = Math.min(...childrenXs);
          const maxX = Math.max(...childrenXs);

          // Exit from side of parent node
          const exitSide = (minX + maxX) / 2 < parentX ? 'left' : 'right';
          const exitX =
            exitSide === 'left'
              ? parentX - NODE_VISUAL_SIZE / 2
              : parentX + NODE_VISUAL_SIZE / 2;

          // Extend horizontally before descending
          const extendDistance = 30;
          const extendX =
            exitSide === 'left'
              ? exitX - extendDistance
              : exitX + extendDistance;

          // Parent exits horizontally from side, then goes to bus
          parentChildPaths.push(
            [
              `M ${exitX} ${parentY}`,
              `L ${extendX} ${parentY}`,
              `L ${extendX} ${busY}`,
              `L ${parentX} ${busY}`,
            ].join(' '),
          );

          // Horizontal bus
          parentChildPaths.push(`M ${minX} ${busY} L ${maxX} ${busY}`);

          // Bus to each child (enter from top)
          children.forEach((child) => {
            const childX = child.node.x + NODE_WIDTH / 2;
            const childY = child.node.y;
            parentChildPaths.push(`M ${childX} ${busY} L ${childX} ${childY}`);
          });
        }
      } else {
        // Two parents case
        const [parent1Id, parent2Id] = key.split('|||');
        const parent1 = nodeMap.get(parent1Id);
        const parent2 = nodeMap.get(parent2Id);

        if (!parent1 || !parent2) {
          return;
        }

        const parent1X = parent1.x + NODE_WIDTH / 2;
        const parent1Y = parent1.y + NODE_VISUAL_SIZE / 2;
        const parent2X = parent2.x + NODE_WIDTH / 2;
        const parent2Y = parent2.y + NODE_VISUAL_SIZE / 2;

        const midX = (parent1X + parent2X) / 2;
        const junctionY = Math.max(parent1Y, parent2Y) + 50;

        // Get all children for this parent pair
        const children = Array.from(childrenIds)
          .map((childId) => ({
            id: childId,
            node: nodeMap.get(childId)!,
          }))
          .filter((c) => c.node)
          .sort((a, b) => a.node.x - b.node.x);

        // Check if there's a partner connection between these parents
        const partnerKey = [parent1Id, parent2Id].sort().join('|||');
        const partnerConnection = partnerConnections.get(partnerKey);

        if (partnerConnection) {
          // Parents are partners - branch off from their existing connection
          const midX = (partnerConnection.x1 + partnerConnection.x2) / 2;
          // Drop point extends further down
          const dropY =
            partnerConnection.y + (GENERATION_SPACING / 2) * BEND_OFFSET;

          if (children.length === 1) {
            // Single child
            const child = children[0].node;
            const childX = child.x + NODE_WIDTH / 2;
            const childY = child.y; // Enter at top

            parentChildPaths.push(
              `M ${midX} ${partnerConnection.y} L ${midX} ${dropY} L ${childX} ${dropY} L ${childX} ${childY}`,
            );
          } else {
            // Multiple children - create bus at the drop point
            const busY = dropY;
            const childrenXs = children.map((c) => c.node.x + NODE_WIDTH / 2);
            const minX = Math.min(...childrenXs);
            const maxX = Math.max(...childrenXs);

            // Drop from partner connection to bus
            parentChildPaths.push(
              `M ${midX} ${partnerConnection.y} L ${midX} ${busY}`,
            );

            // Horizontal bus
            parentChildPaths.push(`M ${minX} ${busY} L ${maxX} ${busY}`);

            // Bus to each child (enter from top)
            children.forEach((child) => {
              const childX = child.node.x + NODE_WIDTH / 2;
              const childY = child.node.y;
              parentChildPaths.push(
                `M ${childX} ${busY} L ${childX} ${childY}`,
              );
            });
          }
        } else {
          // Parents are not partners - create traditional T-junction
          // Exit horizontally from outer sides before descending
          const leftParent = parent1X < parent2X ? parent1 : parent2;
          const rightParent = parent1X < parent2X ? parent2 : parent1;
          const leftX = leftParent.x + NODE_WIDTH / 2;
          const rightX = rightParent.x + NODE_WIDTH / 2;

          // Extend horizontally beyond nodes
          const extendDistance = 30;
          const leftExtendX = leftX - NODE_VISUAL_SIZE / 2 - extendDistance;
          const rightExtendX = rightX + NODE_VISUAL_SIZE / 2 + extendDistance;

          // Junction extends further down
          const junctionY =
            Math.max(parent1Y, parent2Y) +
            (GENERATION_SPACING / 2) * BEND_OFFSET;
          const midX = (leftX + rightX) / 2;

          // Left parent: exit left, go horizontally, then down to junction
          parentChildPaths.push(
            `M ${leftX - NODE_VISUAL_SIZE / 2} ${leftParent.y + NODE_VISUAL_SIZE / 2} L ${leftExtendX} ${leftParent.y + NODE_VISUAL_SIZE / 2} L ${leftExtendX} ${junctionY} L ${midX} ${junctionY}`,
          );

          // Right parent: exit right, go horizontally, then down to junction
          parentChildPaths.push(
            `M ${rightX + NODE_VISUAL_SIZE / 2} ${rightParent.y + NODE_VISUAL_SIZE / 2} L ${rightExtendX} ${rightParent.y + NODE_VISUAL_SIZE / 2} L ${rightExtendX} ${junctionY} L ${midX} ${junctionY}`,
          );

          if (children.length === 1) {
            // Single child
            const child = children[0].node;
            const childX = child.x + NODE_WIDTH / 2;
            const childY = child.y; // Enter at top

            parentChildPaths.push(
              `M ${midX} ${junctionY} L ${midX} ${junctionY + 20} L ${childX} ${junctionY + 20} L ${childX} ${childY}`,
            );
          } else {
            // Multiple children - bus at junction level
            const busY = junctionY;
            const childrenXs = children.map((c) => c.node.x + NODE_WIDTH / 2);
            const minX = Math.min(...childrenXs);
            const maxX = Math.max(...childrenXs);

            parentChildPaths.push(`M ${midX} ${junctionY} L ${midX} ${busY}`);
            parentChildPaths.push(`M ${minX} ${busY} L ${maxX} ${busY}`);

            children.forEach((child) => {
              const childX = child.node.x + NODE_WIDTH / 2;
              const childY = child.node.y; // Enter at top
              parentChildPaths.push(
                `M ${childX} ${busY} L ${childX} ${childY}`,
              );
            });
          }
        }
      }
    });

    return {
      partnerEdgePaths: partnerPaths,
      parentChildEdgePaths: parentChildPaths,
    };
  }, [edges, nodeMap]);

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width="100%"
      height="100%"
    >
      <defs>
        {/* Define markers for edge endpoints if needed */}
        <marker
          id="edge-dot"
          viewBox="0 0 8 8"
          refX="4"
          refY="4"
          markerWidth="4"
          markerHeight="4"
        >
          <circle cx="4" cy="4" r="2" fill="currentColor" />
        </marker>
      </defs>

      {/* Render all edges in white */}
      <g className="all-edges">
        {/* Partner edges */}
        {partnerEdgePaths.map((path, index) => (
          <path
            key={`partner-${index}`}
            d={path}
            fill="none"
            stroke="white"
            strokeWidth="5"
            opacity="1"
          />
        ))}
        {/* Parent-child edges */}
        {parentChildEdgePaths.map((path, index) => (
          <path
            key={`parent-child-${index}`}
            d={path}
            fill="none"
            stroke="white"
            strokeWidth="5"
            opacity="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>
    </svg>
  );
}
