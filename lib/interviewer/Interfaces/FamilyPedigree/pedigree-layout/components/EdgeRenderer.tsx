import { useMemo, type JSX } from 'react';
import { type ConnectorRenderData } from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/pedigreeAdapter';
import {
  type AuxiliaryConnector,
  type LineSegment,
  type ParentChildConnector,
  type ParentGroupConnector,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/types';

export const EDGE_WIDTH = 5;
export const DASHED_PATTERN = '8 8';

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
  if (conn.double) {
    return (
      <g key={`consang-${idx}`}>
        {renderLine(conn.segment, color, `consang-line1-${idx}`)}
        {conn.doubleSegment &&
          renderLine(conn.doubleSegment, color, `consang-line2-${idx}`)}
      </g>
    );
  }

  if (!conn.isActive) {
    return renderInactiveGroupLine(conn, idx, color);
  }

  return renderLine(conn.segment, color, `group-bar-${idx}`, {
    strokeLinecap: 'round',
  });
}

function renderInactiveGroupLine(
  conn: ParentGroupConnector,
  idx: number,
  color: string,
) {
  const { x1, y1, x2, y2 } = conn.segment;
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const SLASH_HEIGHT = 12;
  const SLASH_WIDTH = 4;
  const SLASH_GAP = 4;
  const BREAK_HALF_WIDTH = SLASH_WIDTH + SLASH_GAP / 2;

  const nhw = conn.nodeHalfWidth ?? 0;
  const leftNodeEdge = x1 + nhw;
  const rightNodeEdge = x2 - nhw;

  // Start with the preferred side if specified, otherwise center.
  let breakCenterX: number;
  if (conn.slashSide === 'left') {
    breakCenterX = leftNodeEdge + (midX - leftNodeEdge) / 2;
  } else if (conn.slashSide === 'right') {
    breakCenterX = midX + (rightNodeEdge - midX) / 2;
  } else {
    breakCenterX = midX;
  }

  if (conn.descentXPositions?.length) {
    const CLEARANCE = BREAK_HALF_WIDTH + EDGE_WIDTH;
    const tooClose = conn.descentXPositions.some(
      (dx) => Math.abs(dx - breakCenterX) < CLEARANCE,
    );
    if (tooClose) {
      const minDescent = Math.min(...conn.descentXPositions);
      const maxDescent = Math.max(...conn.descentXPositions);

      // Place break equidistant between the descent line and the closest node edge
      const leftGap = minDescent - leftNodeEdge;
      const rightGap = rightNodeEdge - maxDescent;
      if (leftGap > rightGap) {
        breakCenterX = leftNodeEdge + leftGap / 2;
      } else {
        breakCenterX = maxDescent + rightGap / 2;
      }
    }
  }

  const safeCenter = Math.max(
    x1 + nhw + BREAK_HALF_WIDTH,
    Math.min(breakCenterX, x2 - nhw - BREAK_HALF_WIDTH),
  );

  return (
    <g key={`group-bar-inactive-${idx}`}>
      {renderLine(
        {
          type: 'line',
          x1,
          y1,
          x2: safeCenter - BREAK_HALF_WIDTH,
          y2: midY,
        },
        color,
        `group-bar-left-${idx}`,
      )}
      {renderLine(
        {
          type: 'line',
          x1: safeCenter + BREAK_HALF_WIDTH,
          y1: midY,
          x2,
          y2,
        },
        color,
        `group-bar-right-${idx}`,
      )}
      <line
        x1={safeCenter - SLASH_GAP / 2 - SLASH_WIDTH}
        y1={midY + SLASH_HEIGHT / 2}
        x2={safeCenter - SLASH_GAP / 2}
        y2={midY - SLASH_HEIGHT / 2}
        stroke={color}
        strokeWidth={EDGE_WIDTH}
        strokeLinecap="round"
      />
      <line
        x1={safeCenter + SLASH_GAP / 2}
        y1={midY + SLASH_HEIGHT / 2}
        x2={safeCenter + SLASH_GAP / 2 + SLASH_WIDTH}
        y2={midY - SLASH_HEIGHT / 2}
        stroke={color}
        strokeWidth={EDGE_WIDTH}
        strokeLinecap="round"
      />
    </g>
  );
}

function getAuxiliaryStyle(edgeType: AuxiliaryConnector['edgeType']) {
  switch (edgeType) {
    case 'unpartnered-parent':
    case 'social':
    case 'adoptive':
      return { strokeDasharray: DASHED_PATTERN, strokeWidth: EDGE_WIDTH };
    case 'donor':
    case 'surrogate':
    case 'biological':
      return { strokeWidth: EDGE_WIDTH };
  }
}

function renderAuxiliary(conn: AuxiliaryConnector, idx: number, color: string) {
  const style = getAuxiliaryStyle(conn.edgeType);
  return renderLine(conn.segment, color, `aux-${idx}`, {
    ...('strokeDasharray' in style
      ? { strokeDasharray: style.strokeDasharray }
      : {}),
    strokeWidth: style.strokeWidth,
    strokeLinecap: 'round',
  });
}

function renderParentChild(
  conn: ParentChildConnector,
  idx: number,
  color: string,
) {
  const isDashed = conn.edgeType === 'social' || conn.edgeType === 'adoptive';

  // For dashed (social/adoptive) edges, combine all segments into a single
  // polyline so the dash pattern flows continuously instead of restarting
  // at each segment boundary.
  if (isDashed) {
    const allSegments = [...conn.parentLink, conn.siblingBar, ...conn.uplines];
    const points = segmentsToPolylinePoints(allSegments);

    return (
      <g key={`pc-${idx}`}>
        {points.map((pts, i) => (
          <polyline
            key={`pc-${idx}-path-${i}`}
            points={pts}
            fill="none"
            stroke={color}
            strokeWidth={EDGE_WIDTH}
            strokeDasharray={DASHED_PATTERN}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>
    );
  }

  return (
    <g key={`pc-${idx}`}>
      {conn.uplines.map((ul, i) =>
        renderLine(ul, color, `pc-${idx}-up-${i}`, {
          strokeLinecap: 'round',
        }),
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

/**
 * Convert an array of line segments into connected polyline point strings.
 * Segments that share endpoints are merged into a single polyline.
 * Returns an array of point strings (one per connected chain).
 */
function segmentsToPolylinePoints(segments: LineSegment[]): string[] {
  if (segments.length === 0) return [];

  const chains: { x: number; y: number }[][] = [];

  for (const seg of segments) {
    // Skip degenerate segments (zero length)
    if (seg.x1 === seg.x2 && seg.y1 === seg.y2) continue;

    const start = { x: seg.x1, y: seg.y1 };
    const end = { x: seg.x2, y: seg.y2 };

    // Try to append to an existing chain
    let merged = false;
    for (const chain of chains) {
      const last = chain[chain.length - 1]!;
      if (last.x === start.x && last.y === start.y) {
        chain.push(end);
        merged = true;
        break;
      }
    }

    if (!merged) {
      chains.push([start, end]);
    }
  }

  return chains.map((chain) => chain.map((p) => `${p.x},${p.y}`).join(' '));
}

type PedigreeEdgeSvgProps = {
  connectorData: ConnectorRenderData | null;
  color: string;
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
};

export function PedigreeEdgeSvg({
  connectorData,
  color,
  width,
  height,
  offsetX = 0,
  offsetY = 0,
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
      {offsetX !== 0 || offsetY !== 0 ? (
        <g transform={`translate(${offsetX},${offsetY})`}>{svgElements}</g>
      ) : (
        svgElements
      )}
    </svg>
  );
}
