'use client';

import { useMemo, type ReactNode } from 'react';
import Spinner from '~/components/Spinner';
import {
  type NodeData,
  type StoreEdge,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import { alignPedigree } from '~/lib/pedigree-layout/alignPedigree';
import { computeBioRelatives } from '~/lib/pedigree-layout/computeBioRelatives';
import { PedigreeEdgeSvg } from '~/lib/pedigree-layout/components/EdgeRenderer';
import {
  computeLayoutMetrics,
  type LayoutDimensions,
} from '~/lib/pedigree-layout/layoutDimensions';
import {
  buildConnectorData,
  pedigreeLayoutToPositions,
  storeToPedigreeInput,
} from '~/lib/pedigree-layout/pedigreeAdapter';

type PedigreeLayoutNode = NodeData & { id: string };

type PedigreeLayoutProps = {
  nodes: Map<string, NodeData>;
  edges: Map<string, StoreEdge>;
  biologicalSexVariable: string;
  nodeWidth: number;
  nodeHeight: number;
  renderNode: (node: PedigreeLayoutNode) => ReactNode;
};

export default function PedigreeLayout({
  nodes,
  edges,
  biologicalSexVariable,
  nodeWidth,
  nodeHeight,
  renderNode,
}: PedigreeLayoutProps) {
  const dimensions: LayoutDimensions = useMemo(
    () => ({
      nodeWidth,
      nodeHeight,
    }),
    [nodeWidth, nodeHeight],
  );

  const metrics = useMemo(() => computeLayoutMetrics(dimensions), [dimensions]);

  const layoutResult = useMemo(() => {
    if (dimensions.nodeWidth === 0 || dimensions.nodeHeight === 0) return null;
    if (nodes.size === 0) return null;

    const { input, indexToId, idToIndex } = storeToPedigreeInput(
      nodes,
      edges,
      biologicalSexVariable,
    );
    if (input.id.length === 0) return null;

    const layout = alignPedigree(input);
    const positions = pedigreeLayoutToPositions(layout, indexToId, dimensions);
    const connectorData = buildConnectorData(
      layout,
      edges,
      dimensions,
      input.parents,
      idToIndex,
    );

    return { positions, connectorData };
  }, [nodes, edges, biologicalSexVariable, dimensions]);

  const bioRelatives = useMemo(() => {
    const egoEntry = [...nodes.entries()].find(([, n]) => n.isEgo);
    if (!egoEntry) return new Set<string>();
    return computeBioRelatives(egoEntry[0], edges);
  }, [nodes, edges]);

  if (nodeWidth === 0 || nodeHeight === 0) {
    return (
      <div className="flex size-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!layoutResult) return null;

  const { positions, connectorData } = layoutResult;

  // Diamond nodes overflow their container because scale(0.85) + rotate(45°)
  // produces a bounding box ~1.2× the node size. Add inset so nodes and edges
  // are shifted inward, preventing diamond tips from being clipped.
  const diamondInset = Math.ceil(nodeWidth * 0.1);

  let totalWidth = 0;
  let totalHeight = 0;
  for (const pos of positions.values()) {
    const rightEdge = pos.x + metrics.containerWidth;
    const bottomEdge = pos.y + metrics.containerHeight;
    if (rightEdge > totalWidth) totalWidth = rightEdge;
    if (bottomEdge > totalHeight) totalHeight = bottomEdge;
  }

  totalWidth += diamondInset * 2;
  totalHeight += diamondInset * 2;

  const edgeColor = 'var(--color-edge-1)';

  return (
    <div
      className="relative"
      style={{ width: totalWidth, height: totalHeight }}
    >
      <PedigreeEdgeSvg
        connectorData={connectorData}
        color={edgeColor}
        width={totalWidth}
        height={totalHeight}
        offsetX={diamondInset}
        offsetY={diamondInset}
      />
      {Array.from(nodes.entries()).map(([id, node]) => {
        const pos = positions.get(id);
        if (!pos) return null;

        return (
          <div
            key={id}
            className="absolute"
            style={{
              top: pos.y + diamondInset,
              left: pos.x + diamondInset,
              width: metrics.containerWidth,
              height: metrics.containerHeight,
            }}
          >
            {renderNode({ id, ...node, isBioRelative: bioRelatives.has(id) })}
          </div>
        );
      })}
    </div>
  );
}
