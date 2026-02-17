import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import concaveman from 'concaveman';
import { useEffect, useRef } from 'react';
import { type CanvasStoreApi } from '~/lib/interviewer/canvas/useCanvasStore';

type CategoricalOption = { value: number; label: string };

type ConvexHullLayerProps = {
  store: CanvasStoreApi;
  nodes: NcNode[];
  groupVariable: string;
  categoricalOptions: CategoricalOption[];
};

type GroupData = {
  nodeIds: string[];
  colorIndex: number;
};

/**
 * Groups nodes by their categorical variable values.
 * A single node can belong to multiple groups (categorical values are arrays).
 */
function groupNodesByVariable(
  nodes: NcNode[],
  groupVariable: string,
  categoricalOptions: CategoricalOption[],
): Map<number, GroupData> {
  const groups = new Map<number, GroupData>();

  for (const node of nodes) {
    const values = node[entityAttributesProperty][groupVariable];
    if (!Array.isArray(values)) continue;

    for (const value of values as number[]) {
      let group = groups.get(value);
      if (!group) {
        const optionIndex = categoricalOptions.findIndex(
          (opt) => opt.value === value,
        );
        group = {
          nodeIds: [],
          colorIndex: optionIndex >= 0 ? optionIndex + 1 : 1,
        };
        groups.set(value, group);
      }
      group.nodeIds.push(node[entityPrimaryKeyProperty]);
    }
  }

  return groups;
}

export default function ConvexHullLayer({
  store,
  nodes,
  groupVariable,
  categoricalOptions,
}: ConvexHullLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const elementsRef = useRef<SVGElement[]>([]);
  const rafRef = useRef<number | null>(null);
  const groupsRef = useRef<Map<number, GroupData>>(new Map());

  // Update groups when nodes or groupVariable change
  useEffect(() => {
    groupsRef.current = groupNodesByVariable(
      nodes,
      groupVariable,
      categoricalOptions,
    );
  }, [nodes, groupVariable, categoricalOptions]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Clean up previous elements
    for (const el of elementsRef.current) {
      if (el.parentNode === svg) svg.removeChild(el);
    }
    elementsRef.current = [];

    const groups = groupNodesByVariable(
      nodes,
      groupVariable,
      categoricalOptions,
    );
    groupsRef.current = groups;

    const svgNS = svg.namespaceURI;
    const elementMap = new Map<number, SVGElement>();

    for (const [value, group] of groups) {
      // Create a polygon for each group (will be updated to circle/ellipse as needed)
      const el = document.createElementNS(
        svgNS,
        'polygon',
      ) as SVGPolygonElement;
      el.setAttribute('fill', `var(--color-cat-color-seq-${group.colorIndex})`);
      el.setAttribute('fill-opacity', '0.15');
      el.setAttribute(
        'stroke',
        `var(--color-cat-color-seq-${group.colorIndex})`,
      );
      el.setAttribute('stroke-opacity', '0.5');
      el.setAttribute('stroke-width', '0.008');
      el.setAttribute('stroke-linejoin', 'round');
      el.setAttribute('visibility', 'hidden');
      svg.appendChild(el);
      elementMap.set(value, el);
      elementsRef.current.push(el);
    }

    const updateHulls = () => {
      const { positions } = store.getState();
      const currentGroups = groupsRef.current;

      for (const [value, group] of currentGroups) {
        const el = elementMap.get(value);
        if (!el) continue;

        const coords: number[][] = [];
        for (const nodeId of group.nodeIds) {
          const pos = positions.get(nodeId);
          if (pos) coords.push([pos.x, pos.y]);
        }

        if (coords.length === 0) {
          el.setAttribute('visibility', 'hidden');
          continue;
        }

        el.setAttribute('visibility', 'visible');

        if (coords.length === 1) {
          // Single node: draw a small circle using a polygon approximation
          const coord = coords[0]!;
          const ccx = coord[0] ?? 0;
          const ccy = coord[1] ?? 0;
          const r = 0.04;
          const points = Array.from({ length: 16 }, (_, i) => {
            const angle = (i / 16) * Math.PI * 2;
            return `${ccx + r * Math.cos(angle)},${ccy + r * Math.sin(angle)}`;
          }).join(' ');
          el.setAttribute('points', points);
        } else if (coords.length === 2) {
          // Two nodes: draw a capsule (ellipse approximation)
          const p1 = coords[0]!;
          const p2 = coords[1]!;
          const p1x = p1[0] ?? 0;
          const p1y = p1[1] ?? 0;
          const p2x = p2[0] ?? 0;
          const p2y = p2[1] ?? 0;
          const mx = (p1x + p2x) / 2;
          const my = (p1y + p2y) / 2;
          const dx = p2x - p1x;
          const dy = p2y - p1y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const halfLen = len / 2 + 0.03;
          const halfWidth = 0.03;
          const angle = Math.atan2(dy, dx);
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          // Build capsule from two semicircles connected by lines
          const capsulePoints: string[] = [];
          // Top arc (from p1 side)
          for (let i = 0; i <= 8; i++) {
            const a = Math.PI / 2 + (i / 8) * Math.PI;
            const lx = -halfLen + halfWidth * Math.cos(a);
            const ly = halfWidth * Math.sin(a);
            capsulePoints.push(
              `${mx + lx * cos - ly * sin},${my + lx * sin + ly * cos}`,
            );
          }
          // Bottom arc (from p2 side)
          for (let i = 0; i <= 8; i++) {
            const a = -Math.PI / 2 + (i / 8) * Math.PI;
            const lx = halfLen + halfWidth * Math.cos(a);
            const ly = halfWidth * Math.sin(a);
            capsulePoints.push(
              `${mx + lx * cos - ly * sin},${my + lx * sin + ly * cos}`,
            );
          }
          el.setAttribute('points', capsulePoints.join(' '));
        } else {
          // 3+ nodes: use concaveman
          const hull = concaveman(coords, 0.6, 0);
          const points = hull.map(([x, y]) => `${x},${y}`).join(' ');
          el.setAttribute('points', points);
        }
      }

      rafRef.current = requestAnimationFrame(updateHulls);
    };

    rafRef.current = requestAnimationFrame(updateHulls);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      for (const el of elementsRef.current) {
        if (el.parentNode === svg) svg.removeChild(el);
      }
    };
  }, [nodes, groupVariable, categoricalOptions, store]);

  if (!groupVariable || nodes.length === 0) return null;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1 1"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 size-full"
    />
  );
}
