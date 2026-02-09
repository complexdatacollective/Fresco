import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { FAMILY_TREE_CONFIG } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/config';
import { useFamilyTreeStore } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/FamilyTreeProvider';
import {
  getCurrentStage,
  getEdgeColorForType,
} from '~/lib/interviewer/selectors/session';
import {
  type LineSegment,
  type ParentChildConnector,
  type SpouseConnector,
} from '~/lib/pedigree-layout/types';

const EDGE_WIDTH = 5;

export const getEdgeType = createSelector(getCurrentStage, (stage) => {
  invariant(
    stage.type === 'FamilyTreeCensus',
    'Stage must be FamilyTreeCensus',
  );

  return stage.edgeType.type;
});

function renderLine(
  seg: LineSegment,
  color: string,
  key: string,
  extra?: React.SVGAttributes<SVGLineElement>,
) {
  return (
    <line
      key={key}
      x1={seg.x1}
      y1={seg.y1}
      x2={seg.x2}
      y2={seg.y2}
      stroke={color}
      strokeWidth={EDGE_WIDTH}
      {...extra}
    />
  );
}

function renderSpouse(conn: SpouseConnector, idx: number, color: string) {
  const seg = conn.segment;

  if (conn.double) {
    return (
      <g key={`consang-${idx}`}>
        {renderLine(conn.segment, color, `consang-line1-${idx}`)}
        {conn.doubleSegment &&
          renderLine(conn.doubleSegment, color, `consang-line2-${idx}`)}
      </g>
    );
  }

  // Regular partner: double horizontal lines
  const offset = EDGE_WIDTH;
  return (
    <g key={`partner-${idx}`}>
      <line
        x1={seg.x1}
        y1={seg.y1 - offset}
        x2={seg.x2}
        y2={seg.y2 - offset}
        stroke={color}
        strokeWidth={EDGE_WIDTH}
      />
      <line
        x1={seg.x1}
        y1={seg.y1 + offset}
        x2={seg.x2}
        y2={seg.y2 + offset}
        stroke={color}
        strokeWidth={EDGE_WIDTH}
      />
    </g>
  );
}

function renderParentChild(
  conn: ParentChildConnector,
  idx: number,
  color: string,
) {
  return (
    <g key={`pc-${idx}`}>
      {conn.uplines.map((ul, i) =>
        renderLine(ul, color, `pc-${idx}-up-${i}`, { strokeLinecap: 'round' }),
      )}
      {renderLine(conn.siblingBar, color, `pc-${idx}-bar`, {
        strokeLinecap: 'round',
      })}
      {conn.parentLink.map((pl, i) =>
        renderLine(pl, color, `pc-${idx}-pl-${i}`, {
          strokeLinecap: 'round',
        }),
      )}
    </g>
  );
}

export default function EdgeRenderer() {
  const nodeMap = useFamilyTreeStore((state) => state.network.nodes);
  const connectorData = useFamilyTreeStore((state) => state.connectorData);

  const edgeType = useSelector(getEdgeType);
  const edgeColor = useSelector(getEdgeColorForType(edgeType));

  const color = `var(--${edgeColor})`;

  const svgElements = useMemo(() => {
    if (!connectorData) return [];

    const { connectors } = connectorData;
    const elements: JSX.Element[] = [];

    // Spouse/partner lines - render as double horizontal lines
    for (let i = 0; i < connectors.spouseLines.length; i++) {
      const sp = connectors.spouseLines[i]!;
      elements.push(renderSpouse(sp, i, color));
    }

    // Parent-child connectors
    for (let i = 0; i < connectors.parentChildLines.length; i++) {
      elements.push(
        renderParentChild(connectors.parentChildLines[i]!, i, color),
      );
    }

    // Twin indicators
    for (let i = 0; i < connectors.twinIndicators.length; i++) {
      const ti = connectors.twinIndicators[i]!;
      if (ti.segment) {
        elements.push(
          renderLine(ti.segment, color, `twin-${i}`, {
            strokeWidth: EDGE_WIDTH / 2,
          }),
        );
      }
      if (ti.label) {
        elements.push(
          <text
            key={`twin-label-${i}`}
            x={ti.label.x}
            y={ti.label.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={color}
            fontSize={14}
          >
            ?
          </text>,
        );
      }
    }

    // Duplicate arcs
    for (let i = 0; i < connectors.duplicateArcs.length; i++) {
      const da = connectors.duplicateArcs[i]!;
      const points = da.path.points.map((p) => `${p.x},${p.y}`).join(' ');
      elements.push(
        <polyline
          key={`dup-arc-${i}`}
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={EDGE_WIDTH / 2}
          strokeDasharray={da.path.dashed ? '6 4' : undefined}
        />,
      );
    }

    return elements;
  }, [connectorData, color]);

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
