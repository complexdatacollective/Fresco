'use client';

import { type NcEdge, type NcNode } from '@codaco/shared-consts';
import { useMemo, type ReactNode } from 'react';
import Spinner from '@codaco/fresco-ui/Spinner';
import { alignPedigree } from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/alignPedigree';
import { PedigreeEdgeSvg } from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/components/EdgeRenderer';
import {
    computeLayoutMetrics,
    type LayoutDimensions,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/layoutDimensions';
import {
    buildConnectorData,
    pedigreeLayoutToPositions,
    storeToPedigreeInput,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/pedigreeAdapter';
import { type VariableConfig } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

type PedigreeLayoutNode = NcNode & { id: string };

type PedigreeLayoutProps = {
  nodes: Map<string, NcNode>;
  edges: Map<string, NcEdge>;
  variableConfig: VariableConfig;
  nodeWidth: number;
  nodeHeight: number;
  renderNode: (node: PedigreeLayoutNode) => ReactNode;
};

export default function PedigreeLayout({
  nodes,
  edges,
  variableConfig,
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
      variableConfig,
    );
    if (input.id.length === 0) return null;

    const layout = alignPedigree(input);
    const positions = pedigreeLayoutToPositions(layout, indexToId, dimensions);
    const nodeNames = variableConfig.nodeLabelVariable
      ? indexToId.map((id) => {
          const node = nodes.get(id);
          const name = node?.attributes[variableConfig.nodeLabelVariable];
          return typeof name === 'string' ? name : '';
        })
      : undefined;

    const connectorData = buildConnectorData(
      layout,
      edges,
      dimensions,
      variableConfig,
      input.parents,
      idToIndex,
      nodeNames,
    );

    return { positions, connectorData };
  }, [nodes, edges, dimensions, variableConfig]);

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
            {renderNode({ id, ...node })}
          </div>
        );
      })}
    </div>
  );
}
