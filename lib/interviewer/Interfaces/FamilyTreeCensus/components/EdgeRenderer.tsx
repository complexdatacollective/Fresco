import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { useMemo, type JSX } from 'react';
import { type ConnectorRenderData } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/pedigreeAdapter';
import { getCurrentStage } from '~/lib/interviewer/selectors/session';
import {
  type AuxiliaryConnector,
  type LineSegment,
  type ParentChildConnector,
  type ParentGroupConnector,
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

function renderGroupLine(
  conn: ParentGroupConnector,
  idx: number,
  color: string,
) {
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

function getAuxiliaryStyle(edgeType: AuxiliaryConnector['edgeType']) {
  switch (edgeType) {
    case 'bio-parent':
      return { strokeDasharray: '8 4', strokeWidth: 3, opacity: 0.8 };
    case 'donor':
    case 'surrogate':
      return { strokeDasharray: '2 4', strokeWidth: 2, opacity: 0.6 };
  }
}

function renderAuxiliary(conn: AuxiliaryConnector, idx: number, color: string) {
  const style = getAuxiliaryStyle(conn.edgeType);
  return (
    <g key={`aux-${idx}`}>
      {conn.segments.map((seg, i) =>
        renderLine(seg, color, `aux-${idx}-seg-${i}`, {
          strokeDasharray: style.strokeDasharray,
          strokeWidth: style.strokeWidth,
          opacity: style.opacity,
          strokeLinecap: 'round',
        }),
      )}
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

type PedigreeEdgeSvgProps = {
  connectorData: ConnectorRenderData | null;
  color: string;
  width: number;
  height: number;
};

export function PedigreeEdgeSvg({
  connectorData,
  color,
  width,
  height,
}: PedigreeEdgeSvgProps) {
  const svgElements = useMemo(() => {
    if (!connectorData) return [];

    const { connectors } = connectorData;
    const elements: JSX.Element[] = [];

    for (let i = 0; i < connectors.groupLines.length; i++) {
      const gl = connectors.groupLines[i]!;
      elements.push(renderGroupLine(gl, i, color));
    }

    for (let i = 0; i < connectors.parentChildLines.length; i++) {
      elements.push(
        renderParentChild(connectors.parentChildLines[i]!, i, color),
      );
    }

    for (let i = 0; i < connectors.auxiliaryLines.length; i++) {
      elements.push(renderAuxiliary(connectors.auxiliaryLines[i]!, i, color));
    }

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

  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute top-0 left-0"
      width={width}
      height={height}
    >
      {svgElements}
    </svg>
  );
}
