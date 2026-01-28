import type { Meta, StoryFn } from '@storybook/nextjs-vite';
import { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { FAMILY_TREE_CONFIG } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/config';
import { type ConnectorRenderData } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/pedigreeAdapter';
import {
  createFamilyTreeStore,
  type Edge,
  type FamilyTreeStoreApi,
} from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/store';
import { type FamilyTreeNodeType } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import { Node } from '~/lib/ui/components';
import {
  type LineSegment,
  type ParentChildConnector,
  type SpouseConnector,
} from '~/lib/pedigree-layout/types';

const meta: Meta = {
  title: 'Systems/FamilyTree/PedigreeLayout',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

// ── Helpers to build test graphs ──

type NodeDef = {
  id: string;
  label: string;
  sex?: 'male' | 'female';
  isEgo?: boolean;
};

type EdgeDef = {
  source: string;
  target: string;
  relationship: Edge['relationship'];
};

function buildStore(nodeDefs: NodeDef[], edgeDefs: EdgeDef[]) {
  const nodes = new Map<string, Omit<FamilyTreeNodeType, 'id'>>();
  for (const { id, label, sex, isEgo } of nodeDefs) {
    nodes.set(id, { label, sex, isEgo, readOnly: false });
  }

  const edges = new Map<string, Omit<Edge, 'id'>>();
  for (let i = 0; i < edgeDefs.length; i++) {
    const e = edgeDefs[i]!;
    edges.set(`e${i}`, {
      source: e.source,
      target: e.target,
      relationship: e.relationship,
    });
  }

  return createFamilyTreeStore(nodes, edges);
}

// ── SVG rendering helpers ──

const EDGE_WIDTH = 5;
const EDGE_COLOR = 'var(--edge-color-seq-1, #6366f1)';

function renderLine(
  seg: LineSegment,
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
      stroke={EDGE_COLOR}
      strokeWidth={EDGE_WIDTH}
      {...extra}
    />
  );
}

function renderSpouse(conn: SpouseConnector, idx: number) {
  const seg = conn.segment;
  const offset = EDGE_WIDTH;
  return (
    <g key={`partner-${idx}`}>
      <line
        x1={seg.x1}
        y1={seg.y1 - offset}
        x2={seg.x2}
        y2={seg.y2 - offset}
        stroke={EDGE_COLOR}
        strokeWidth={EDGE_WIDTH}
      />
      <line
        x1={seg.x1}
        y1={seg.y1 + offset}
        x2={seg.x2}
        y2={seg.y2 + offset}
        stroke={EDGE_COLOR}
        strokeWidth={EDGE_WIDTH}
      />
    </g>
  );
}

function renderParentChild(conn: ParentChildConnector, idx: number) {
  return (
    <g key={`pc-${idx}`}>
      {conn.uplines.map((ul, i) =>
        renderLine(ul, `pc-${idx}-up-${i}`, { strokeLinecap: 'round' }),
      )}
      {renderLine(conn.siblingBar, `pc-${idx}-bar`, {
        strokeLinecap: 'round',
      })}
      {conn.parentLink.map((pl, i) =>
        renderLine(pl, `pc-${idx}-pl-${i}`, { strokeLinecap: 'round' }),
      )}
    </g>
  );
}

// ── Visualization component ──

function PedigreeVisualization({
  storeRef,
}: {
  storeRef: React.RefObject<FamilyTreeStoreApi | null>;
}) {
  const store = storeRef.current;
  const emptyNodes = new Map<string, Omit<FamilyTreeNodeType, 'id'>>();
  const nodeMap = store ? useStore(store, (s) => s.network.nodes) : emptyNodes;
  const connectorData: ConnectorRenderData | null = store
    ? useStore(store, (s) => s.connectorData)
    : null;

  const nodes = Array.from(nodeMap.entries()).map(([id, node]) => ({
    id,
    ...node,
  }));

  let maxX = 0;
  let maxY = 0;
  for (const node of nodeMap.values()) {
    if (node.x !== undefined && node.y !== undefined) {
      maxX = Math.max(maxX, node.x + FAMILY_TREE_CONFIG.nodeContainerWidth * 2);
      maxY = Math.max(maxY, node.y + FAMILY_TREE_CONFIG.nodeContainerHeight);
    }
  }
  const svgWidth = maxX + FAMILY_TREE_CONFIG.padding;
  const svgHeight = maxY + FAMILY_TREE_CONFIG.padding;

  const svgElements: JSX.Element[] = [];
  if (connectorData) {
    const { connectors } = connectorData;
    for (let i = 0; i < connectors.spouseLines.length; i++) {
      svgElements.push(renderSpouse(connectors.spouseLines[i]!, i));
    }
    for (let i = 0; i < connectors.parentChildLines.length; i++) {
      svgElements.push(renderParentChild(connectors.parentChildLines[i]!, i));
    }
    for (let i = 0; i < connectors.twinIndicators.length; i++) {
      const ti = connectors.twinIndicators[i]!;
      if (ti.segment) {
        svgElements.push(
          renderLine(ti.segment, `twin-${i}`, {
            strokeWidth: EDGE_WIDTH / 2,
          }),
        );
      }
    }
    for (let i = 0; i < connectors.duplicateArcs.length; i++) {
      const da = connectors.duplicateArcs[i]!;
      const points = da.path.points.map((p) => `${p.x},${p.y}`).join(' ');
      svgElements.push(
        <polyline
          key={`dup-arc-${i}`}
          points={points}
          fill="none"
          stroke={EDGE_COLOR}
          strokeWidth={EDGE_WIDTH / 2}
          strokeDasharray={da.path.dashed ? '6 4' : undefined}
        />,
      );
    }
  }

  return (
    <div className="relative h-full w-full overflow-auto bg-[#1a1a2e] p-8">
      <div
        className="relative"
        style={{ minWidth: svgWidth, minHeight: svgHeight }}
      >
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute top-0 left-0"
          width={svgWidth}
          height={svgHeight}
        >
          {svgElements}
        </svg>
        {nodes.map((node) => (
          <div
            key={node.id}
            className="absolute flex flex-col items-center gap-1 text-center"
            style={{
              top: node.y ?? 0,
              left: node.x ?? 0,
              width: FAMILY_TREE_CONFIG.nodeContainerWidth,
              height: FAMILY_TREE_CONFIG.nodeContainerHeight,
            }}
          >
            <Node
              className="shrink-0"
              style={{
                width: FAMILY_TREE_CONFIG.nodeWidth,
                height: FAMILY_TREE_CONFIG.nodeHeight,
              }}
              color={node.isEgo ? 'node-color-seq-2' : 'node-color-seq-1'}
              label={node.isEgo ? 'You' : ''}
              shape={node.sex === 'female' ? 'circle' : 'square'}
              size="sm"
            />
            <span className="text-xs text-white">{node.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Story: Standard 3-generation family ──

export const ThreeGenerationFamily: StoryFn = () => {
  const storeRef = useRef<FamilyTreeStoreApi | null>(null);
  const [, setReady] = useState(false);

  useEffect(() => {
    const store = buildStore(
      [
        { id: 'mgm', label: 'Mat. Grandmother', sex: 'female' },
        { id: 'mgf', label: 'Mat. Grandfather', sex: 'male' },
        { id: 'pgm', label: 'Pat. Grandmother', sex: 'female' },
        { id: 'pgf', label: 'Pat. Grandfather', sex: 'male' },
        { id: 'mother', label: 'Mother', sex: 'female' },
        { id: 'father', label: 'Father', sex: 'male' },
        { id: 'ego', label: 'You', sex: 'male', isEgo: true },
        { id: 'sister', label: 'Sister', sex: 'female' },
        { id: 'brother', label: 'Brother', sex: 'male' },
      ],
      [
        { source: 'mgf', target: 'mgm', relationship: 'partner' },
        { source: 'pgf', target: 'pgm', relationship: 'partner' },
        { source: 'mgf', target: 'mother', relationship: 'parent' },
        { source: 'mgm', target: 'mother', relationship: 'parent' },
        { source: 'pgf', target: 'father', relationship: 'parent' },
        { source: 'pgm', target: 'father', relationship: 'parent' },
        { source: 'father', target: 'mother', relationship: 'partner' },
        { source: 'father', target: 'ego', relationship: 'parent' },
        { source: 'mother', target: 'ego', relationship: 'parent' },
        { source: 'father', target: 'sister', relationship: 'parent' },
        { source: 'mother', target: 'sister', relationship: 'parent' },
        { source: 'father', target: 'brother', relationship: 'parent' },
        { source: 'mother', target: 'brother', relationship: 'parent' },
      ],
    );
    store.getState().runLayout();
    storeRef.current = store;
    setReady(true);
  }, []);

  return <PedigreeVisualization storeRef={storeRef} />;
};

// ── Story: Family with ego's children ──

export const FamilyWithChildren: StoryFn = () => {
  const storeRef = useRef<FamilyTreeStoreApi | null>(null);
  const [, setReady] = useState(false);

  useEffect(() => {
    const store = buildStore(
      [
        { id: 'mother', label: 'Mother', sex: 'female' },
        { id: 'father', label: 'Father', sex: 'male' },
        { id: 'ego', label: 'You', sex: 'female', isEgo: true },
        { id: 'partner', label: 'Partner', sex: 'male' },
        { id: 'daughter', label: 'Daughter', sex: 'female' },
        { id: 'son', label: 'Son', sex: 'male' },
      ],
      [
        { source: 'father', target: 'mother', relationship: 'partner' },
        { source: 'father', target: 'ego', relationship: 'parent' },
        { source: 'mother', target: 'ego', relationship: 'parent' },
        { source: 'partner', target: 'ego', relationship: 'partner' },
        { source: 'ego', target: 'daughter', relationship: 'parent' },
        { source: 'partner', target: 'daughter', relationship: 'parent' },
        { source: 'ego', target: 'son', relationship: 'parent' },
        { source: 'partner', target: 'son', relationship: 'parent' },
      ],
    );
    store.getState().runLayout();
    storeRef.current = store;
    setReady(true);
  }, []);

  return <PedigreeVisualization storeRef={storeRef} />;
};

// ── Story: Extended family with aunts, uncles, cousins ──

export const ExtendedFamily: StoryFn = () => {
  const storeRef = useRef<FamilyTreeStoreApi | null>(null);
  const [, setReady] = useState(false);

  useEffect(() => {
    const store = buildStore(
      [
        { id: 'mgm', label: 'Mat. Grandmother', sex: 'female' },
        { id: 'mgf', label: 'Mat. Grandfather', sex: 'male' },
        { id: 'pgm', label: 'Pat. Grandmother', sex: 'female' },
        { id: 'pgf', label: 'Pat. Grandfather', sex: 'male' },
        { id: 'mother', label: 'Mother', sex: 'female' },
        { id: 'father', label: 'Father', sex: 'male' },
        { id: 'aunt', label: 'Maternal Aunt', sex: 'female' },
        { id: 'uncle-spouse', label: "Aunt's Husband", sex: 'male' },
        { id: 'p-uncle', label: 'Paternal Uncle', sex: 'male' },
        { id: 'ego', label: 'You', sex: 'male', isEgo: true },
        { id: 'sister', label: 'Sister', sex: 'female' },
        { id: 'cousin1', label: 'Cousin (M)', sex: 'male' },
        { id: 'cousin2', label: 'Cousin (F)', sex: 'female' },
      ],
      [
        { source: 'mgf', target: 'mgm', relationship: 'partner' },
        { source: 'pgf', target: 'pgm', relationship: 'partner' },
        { source: 'mgf', target: 'mother', relationship: 'parent' },
        { source: 'mgm', target: 'mother', relationship: 'parent' },
        { source: 'mgf', target: 'aunt', relationship: 'parent' },
        { source: 'mgm', target: 'aunt', relationship: 'parent' },
        { source: 'pgf', target: 'father', relationship: 'parent' },
        { source: 'pgm', target: 'father', relationship: 'parent' },
        { source: 'pgf', target: 'p-uncle', relationship: 'parent' },
        { source: 'pgm', target: 'p-uncle', relationship: 'parent' },
        { source: 'father', target: 'mother', relationship: 'partner' },
        { source: 'uncle-spouse', target: 'aunt', relationship: 'partner' },
        { source: 'father', target: 'ego', relationship: 'parent' },
        { source: 'mother', target: 'ego', relationship: 'parent' },
        { source: 'father', target: 'sister', relationship: 'parent' },
        { source: 'mother', target: 'sister', relationship: 'parent' },
        { source: 'uncle-spouse', target: 'cousin1', relationship: 'parent' },
        { source: 'aunt', target: 'cousin1', relationship: 'parent' },
        { source: 'uncle-spouse', target: 'cousin2', relationship: 'parent' },
        { source: 'aunt', target: 'cousin2', relationship: 'parent' },
      ],
    );
    store.getState().runLayout();
    storeRef.current = store;
    setReady(true);
  }, []);

  return <PedigreeVisualization storeRef={storeRef} />;
};

// ── Story: Ex-partner with half-siblings ──

export const ExPartnerWithHalfSiblings: StoryFn = () => {
  const storeRef = useRef<FamilyTreeStoreApi | null>(null);
  const [, setReady] = useState(false);

  useEffect(() => {
    const store = buildStore(
      [
        { id: 'mother', label: 'Mother', sex: 'female' },
        { id: 'father', label: 'Father', sex: 'male' },
        { id: 'ex-partner', label: "Father's Ex", sex: 'female' },
        { id: 'ego', label: 'You', sex: 'female', isEgo: true },
        { id: 'brother', label: 'Brother', sex: 'male' },
        { id: 'half-sister', label: 'Half-sister', sex: 'female' },
      ],
      [
        { source: 'father', target: 'mother', relationship: 'partner' },
        { source: 'father', target: 'ex-partner', relationship: 'ex-partner' },
        { source: 'father', target: 'ego', relationship: 'parent' },
        { source: 'mother', target: 'ego', relationship: 'parent' },
        { source: 'father', target: 'brother', relationship: 'parent' },
        { source: 'mother', target: 'brother', relationship: 'parent' },
        { source: 'father', target: 'half-sister', relationship: 'parent' },
        { source: 'ex-partner', target: 'half-sister', relationship: 'parent' },
      ],
    );
    store.getState().runLayout();
    storeRef.current = store;
    setReady(true);
  }, []);

  return <PedigreeVisualization storeRef={storeRef} />;
};

// ── Story: Simple couple (minimal case) ──

export const SimpleCouple: StoryFn = () => {
  const storeRef = useRef<FamilyTreeStoreApi | null>(null);
  const [, setReady] = useState(false);

  useEffect(() => {
    const store = buildStore(
      [
        { id: 'ego', label: 'You', sex: 'male', isEgo: true },
        { id: 'partner', label: 'Partner', sex: 'female' },
      ],
      [{ source: 'ego', target: 'partner', relationship: 'partner' }],
    );
    store.getState().runLayout();
    storeRef.current = store;
    setReady(true);
  }, []);

  return <PedigreeVisualization storeRef={storeRef} />;
};

// ── Story: Full scaffolded pedigree (matches generatePlaceholderNetwork) ──

export const FullScaffoldedPedigree: StoryFn = () => {
  const storeRef = useRef<FamilyTreeStoreApi | null>(null);
  const [, setReady] = useState(false);

  useEffect(() => {
    const nodes = new Map<string, Omit<FamilyTreeNodeType, 'id'>>();
    nodes.set('ego', {
      label: 'You',
      sex: 'male',
      isEgo: true,
      readOnly: true,
    });

    const store = createFamilyTreeStore(nodes, new Map());

    store.getState().generatePlaceholderNetwork(
      {
        'brothers': 2,
        'sisters': 1,
        'sons': 1,
        'daughters': 1,
        'paternal-uncles': 1,
        'paternal-aunts': 1,
        'maternal-uncles': 1,
        'maternal-aunts': 1,
      },
      'male',
    );

    storeRef.current = store;
    setReady(true);
  }, []);

  return <PedigreeVisualization storeRef={storeRef} />;
};
