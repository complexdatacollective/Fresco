import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  getCurrentStage,
  getEdgeColorForType,
} from '~/lib/interviewer/selectors/session';
import { FAMILY_TREE_CONFIG } from '../config';
import { useFamilyTreeStore } from '../FamilyTreeProvider';
import { type Edge } from '../store';

const EDGE_WIDTH = 5;

export const getEdgeType = createSelector(getCurrentStage, (stage) => {
  invariant(
    stage.type === 'FamilyTreeCensus',
    'Stage must be FamilyTreeCensus',
  );

  return stage.edgeType.type;
});

export default function EdgeRenderer() {
  const nodeMap = useFamilyTreeStore((state) => state.network.nodes);
  const edgesMap = useFamilyTreeStore((state) => state.network.edges);

  const edgeType = useSelector(getEdgeType);
  const edgeColor = useSelector(getEdgeColorForType(edgeType));

  const safeNumber = (n: unknown): n is number =>
    typeof n === 'number' && !Number.isNaN(n);

  // More useful data structures for the things we need to do in this component
  const { parentEdgesByChild, parentEdgesByParent, partnershipEdges } =
    useMemo(() => {
      const edges = Array.from(edgesMap.entries()).map(([id, edge]) => ({
        id,
        ...edge,
      }));

      const parentByChild = new Map<string, Edge[]>();
      const parentByParent = new Map<string, Edge[]>();
      const partnerships: Edge[] = [];

      for (const edge of edges) {
        if (edge.relationship === 'parent') {
          // Index by child
          const childEdges = parentByChild.get(edge.target) ?? [];
          childEdges.push(edge);
          parentByChild.set(edge.target, childEdges);

          // Index by parent
          const parentEdges = parentByParent.get(edge.source) ?? [];
          parentEdges.push(edge);
          parentByParent.set(edge.source, parentEdges);
        } else if (
          edge.relationship === 'partner' ||
          edge.relationship === 'ex-partner'
        ) {
          partnerships.push(edge);
        }
      }

      return {
        parentEdgesByChild: parentByChild,
        parentEdgesByParent: parentByParent,
        partnershipEdges: partnerships,
      };
    }, [edgesMap]);

  // Process all edge types in a single pass to improve performance
  const svgElements = useMemo(() => {
    const elements: JSX.Element[] = [];

    // 1. Partner and ex-partner edges
    for (const edge of partnershipEdges) {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);
      if (
        !sourceNode ||
        !targetNode ||
        typeof sourceNode.x !== 'number' ||
        typeof sourceNode.y !== 'number' ||
        typeof targetNode.x !== 'number' ||
        typeof targetNode.y !== 'number'
      ) {
        continue;
      }

      const coords = {
        x1: targetNode.x + FAMILY_TREE_CONFIG.nodeContainerWidth / 2,
        y1: sourceNode.y + FAMILY_TREE_CONFIG.nodeHeight / 2,
        x2: targetNode.x + FAMILY_TREE_CONFIG.nodeContainerWidth * 1.5,
        y2: targetNode.y + FAMILY_TREE_CONFIG.nodeHeight / 2,
      };

      if (edge.relationship === 'partner') {
        elements.push(
          <g key={`partner-${edge.source}-${edge.target}`}>
            <line
              x1={coords.x1}
              y1={coords.y1 - EDGE_WIDTH}
              x2={coords.x2}
              y2={coords.y2 - EDGE_WIDTH}
              stroke={`var(--${edgeColor})`}
              strokeWidth={EDGE_WIDTH}
            />
            <line
              x1={coords.x1}
              y1={coords.y1 + EDGE_WIDTH}
              x2={coords.x2}
              y2={coords.y2 + EDGE_WIDTH}
              stroke={`var(--${edgeColor})`}
              strokeWidth={EDGE_WIDTH}
            />
          </g>,
        );
      } else if (edge.relationship === 'ex-partner') {
        elements.push(
          <g key={`ex-partner-${edge.source}-${edge.target}`}>
            <line
              x1={coords.x1}
              y1={coords.y1}
              x2={coords.x2}
              y2={coords.y2}
              stroke={`var(--${edgeColor})`}
              strokeWidth={EDGE_WIDTH}
            />
            <line
              x1={(coords.x1 + coords.x2) / 2}
              y1={coords.y1 - 10}
              x2={(coords.x1 + coords.x2) / 2 - 15}
              y2={coords.y2 + 10}
              stroke={`var(--${edgeColor})`}
              strokeWidth={EDGE_WIDTH}
            />
            <line
              x1={(coords.x1 + coords.x2) / 2 + 15}
              y1={coords.y1 - 10}
              x2={(coords.x1 + coords.x2) / 2 - 5}
              y2={coords.y2 + 10}
              stroke={`var(--${edgeColor})`}
              strokeWidth={EDGE_WIDTH}
            />
          </g>,
        );
      }
    }

    // 2. Offspring connectors (vertical lines from parent couples)
    const processedPairs = new Set<string>();

    for (const partnerEdge of partnershipEdges) {
      const pairKey = [partnerEdge.source, partnerEdge.target].sort().join('-');
      if (processedPairs.has(pairKey)) continue;
      processedPairs.add(pairKey);

      const node1 = nodeMap.get(partnerEdge.source);
      const node2 = nodeMap.get(partnerEdge.target);
      if (
        !node1 ||
        !node2 ||
        !safeNumber(node1.x) ||
        !safeNumber(node1.y) ||
        !safeNumber(node2.x) ||
        !safeNumber(node2.y)
      ) {
        continue;
      }

      // Get children for both partners
      const node1Children =
        parentEdgesByParent.get(partnerEdge.source)?.map((e) => e.target) ?? [];
      const node2Children =
        parentEdgesByParent.get(partnerEdge.target)?.map((e) => e.target) ?? [];

      // Find shared children using Set for O(1) lookup
      const node2ChildSet = new Set(node2Children);
      const sharedChildren = node1Children.filter((child) =>
        node2ChildSet.has(child),
      );

      if (sharedChildren.length === 0) continue;

      // Calculate midpoint between partners
      const xPos =
        (node1.x + (node2.x ?? 0)) / 2 + FAMILY_TREE_CONFIG.partnerSpacing / 2;

      // For ex-partners, start slightly above the connector line
      const yStartPos =
        partnerEdge.relationship === 'ex-partner'
          ? node1.y + FAMILY_TREE_CONFIG.nodeHeight / 2 - 5
          : node1.y + FAMILY_TREE_CONFIG.nodeHeight / 2 + 5;

      const yEndPos =
        node1.y +
        FAMILY_TREE_CONFIG.nodeContainerHeight +
        FAMILY_TREE_CONFIG.padding / 2;

      elements.push(
        <line
          key={`offspring-${pairKey}`}
          x1={xPos}
          y1={yStartPos}
          x2={xPos}
          y2={yEndPos}
          stroke={`var(--${edgeColor})`}
          strokeWidth={EDGE_WIDTH}
        />,
      );
    }

    // 3. Child connectors (L-shaped paths from children)
    for (const [childId, parentEdges] of parentEdgesByChild) {
      if (parentEdges.length < 2) continue; // Need at least 2 parents

      const childNode = nodeMap.get(childId);
      const parent1 = nodeMap.get(parentEdges[0]!.source);
      const parent2 = nodeMap.get(parentEdges[1]!.source);
      if (
        !childNode ||
        !parent1 ||
        !parent2 ||
        !safeNumber(childNode.x) ||
        !safeNumber(childNode.y) ||
        !safeNumber(parent1.x) ||
        !safeNumber(parent1.y) ||
        !safeNumber(parent2.x) ||
        !safeNumber(parent2.y)
      ) {
        continue;
      }

      // Check if parents are partners or ex-partners
      const parent1Id = parentEdges[0]!.source;
      const parent2Id = parentEdges[1]!.source;
      const hasPartnerRelationship = partnershipEdges.some(
        (edge) =>
          (edge.source === parent1Id && edge.target === parent2Id) ||
          (edge.target === parent1Id && edge.source === parent2Id),
      );

      if (!hasPartnerRelationship) continue;

      // Calculate positions
      const xStartPos = childNode.x + FAMILY_TREE_CONFIG.nodeContainerWidth / 2;
      const xEndPos =
        (parent1.x + parent2.x) / 2 + FAMILY_TREE_CONFIG.partnerSpacing / 2;
      const yPos = childNode.y - FAMILY_TREE_CONFIG.padding / 2;
      const height =
        FAMILY_TREE_CONFIG.nodeHeight / 2 + FAMILY_TREE_CONFIG.padding / 2 - 5;

      elements.push(
        <g key={`child-connector-${childId}`}>
          {/* Vertical line from child upward */}
          <line
            x1={xStartPos}
            y1={yPos}
            x2={xStartPos}
            y2={yPos + height}
            stroke={`var(--${edgeColor})`}
            strokeWidth={EDGE_WIDTH}
            strokeLinecap="round"
          />
          {/* Horizontal line to offspring connector */}
          <line
            x1={xStartPos}
            y1={yPos}
            x2={xEndPos}
            y2={yPos}
            stroke={`var(--${edgeColor})`}
            strokeWidth={EDGE_WIDTH}
            strokeLinecap="round"
          />
        </g>,
      );
    }

    return elements;
  }, [
    nodeMap,
    parentEdgesByChild,
    parentEdgesByParent,
    partnershipEdges,
    edgeColor,
  ]);

  // Determine SVG dimensions to encompass all nodes and edges
  const svgDimensions = useMemo(() => {
    let maxX = 0;
    let maxY = 0;

    for (const node of nodeMap.values()) {
      if (node.x !== undefined && node.y !== undefined) {
        maxX = Math.max(
          maxX,
          node.x + FAMILY_TREE_CONFIG.nodeContainerWidth * 2,
        );
        maxY = Math.max(maxY, node.y + FAMILY_TREE_CONFIG.nodeContainerHeight);
      }
    }

    return {
      width: maxX + FAMILY_TREE_CONFIG.padding,
      height: maxY + FAMILY_TREE_CONFIG.padding,
    };
  }, [nodeMap]);

  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute top-0 left-0 min-h-full min-w-full"
      width={svgDimensions.width}
      height={svgDimensions.height}
    >
      {svgElements}
    </svg>
  );
}
