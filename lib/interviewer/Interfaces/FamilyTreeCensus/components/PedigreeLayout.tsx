'use client';

import { useMemo, type ReactNode } from 'react';
import Spinner from '~/components/Spinner';
import { PedigreeEdgeSvg } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/EdgeRenderer';
import { type FamilyTreeNodeType } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import {
  computeLayoutMetrics,
  type LayoutDimensions,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/layoutDimensions';
import {
  buildConnectorData,
  pedigreeLayoutToPositions,
  storeToPedigreeInput,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/pedigreeAdapter';
import { type Edge } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import { alignPedigree } from '~/lib/pedigree-layout/alignPedigree';

type PedigreeLayoutNode = Omit<FamilyTreeNodeType, 'id'> & { id: string };

type PedigreeLayoutProps = {
  nodes: Map<string, Omit<FamilyTreeNodeType, 'id'>>;
  edges: Map<string, Omit<Edge, 'id'>>;
  nodeWidth: number;
  nodeHeight: number;
  labelWidth: number;
  labelHeight: number;
  renderNode: (node: PedigreeLayoutNode) => ReactNode;
};

export default function PedigreeLayout({
  nodes,
  edges,
  nodeWidth,
  nodeHeight,
  labelWidth,
  labelHeight,
  renderNode,
}: PedigreeLayoutProps) {
  const dimensions: LayoutDimensions = useMemo(
    () => ({
      nodeWidth,
      nodeHeight,
      labelWidth,
      labelHeight,
    }),
    [nodeWidth, nodeHeight, labelWidth, labelHeight],
  );

  const metrics = useMemo(() => computeLayoutMetrics(dimensions), [dimensions]);

  const layoutResult = useMemo(() => {
    if (nodeWidth === 0 || nodeHeight === 0) return null;
    if (nodes.size === 0) return null;

    const { input, indexToId } = storeToPedigreeInput(nodes, edges);
    if (input.id.length === 0) return null;

    const layout = alignPedigree(input);
    const positions = pedigreeLayoutToPositions(layout, indexToId, dimensions);
    const connectorData = buildConnectorData(layout, edges, dimensions);

    return { positions, connectorData };
  }, [nodes, edges, dimensions]);

  if (nodeWidth === 0 || nodeHeight === 0) {
    return (
      <div className="flex size-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!layoutResult) return null;

  const { positions, connectorData } = layoutResult;

  let totalWidth = 0;
  let totalHeight = 0;
  for (const pos of positions.values()) {
    const rightEdge = pos.x + metrics.containerWidth;
    const bottomEdge = pos.y + metrics.containerHeight;
    if (rightEdge > totalWidth) totalWidth = rightEdge;
    if (bottomEdge > totalHeight) totalHeight = bottomEdge;
  }

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
      />
      {Array.from(nodes.entries()).map(([id, node]) => {
        const pos = positions.get(id);
        if (!pos) return null;

        return (
          <div
            key={id}
            className="absolute"
            style={{
              top: pos.y,
              left: pos.x,
              width: metrics.containerWidth,
              height: metrics.containerHeight,
            }}
          >
            {renderNode({ id, ...node })}
          </div>
        );
      })}
    </div>
  );
}
