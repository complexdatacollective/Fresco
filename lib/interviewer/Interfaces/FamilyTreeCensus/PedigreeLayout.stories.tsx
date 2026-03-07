import type { Meta, StoryFn } from '@storybook/nextjs-vite';
import { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import Node from '~/components/Node';
import { useNodeMeasurement } from '~/hooks/useNodeMeasurement';
import { type FamilyTreeNodeType } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import PedigreeLayout from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeLayout';
import {
  createFamilyTreeStore,
  type Edge,
  type FamilyTreeStoreApi,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

const meta: Meta = {
  title: 'Systems/FamilyTree/PedigreeLayout',
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'dark' },
  },
};

export default meta;

const LABEL_HEIGHT = 60;

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

function StoryVisualizationInner({ store }: { store: FamilyTreeStoreApi }) {
  const nodesMap = useStore(store, (s) => s.network.nodes);
  const edgesMap = useStore(store, (s) => s.network.edges);
  const { nodeWidth, nodeHeight, portal } = useNodeMeasurement({
    component: <Node size="sm" />,
  });

  return (
    <div className="max-w-full overflow-auto">
      {portal}
      <PedigreeLayout
        nodes={nodesMap}
        edges={edgesMap}
        nodeWidth={nodeWidth}
        nodeHeight={nodeHeight}
        labelWidth={Math.max(nodeWidth, 150)}
        labelHeight={LABEL_HEIGHT}
        renderNode={(node) => (
          <div className="flex flex-col items-center gap-1 text-center">
            <Node
              className="shrink-0"
              color={node.isEgo ? 'node-color-seq-2' : 'node-color-seq-1'}
              label={node.isEgo ? 'You' : ''}
              shape={node.sex === 'female' ? 'circle' : 'square'}
              size="sm"
            />
            <span className="text-xs text-white">{node.label}</span>
          </div>
        )}
      />
    </div>
  );
}

function StoryVisualization({
  storeRef,
}: {
  storeRef: React.RefObject<FamilyTreeStoreApi | null>;
}) {
  if (!storeRef.current) return null;
  return <StoryVisualizationInner store={storeRef.current} />;
}

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
    storeRef.current = store;
    setReady(true);
  }, []);

  return <StoryVisualization storeRef={storeRef} />;
};

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
    storeRef.current = store;
    setReady(true);
  }, []);

  return <StoryVisualization storeRef={storeRef} />;
};

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
        {
          source: 'uncle-spouse',
          target: 'cousin1',
          relationship: 'parent',
        },
        { source: 'aunt', target: 'cousin1', relationship: 'parent' },
        {
          source: 'uncle-spouse',
          target: 'cousin2',
          relationship: 'parent',
        },
        { source: 'aunt', target: 'cousin2', relationship: 'parent' },
      ],
    );
    storeRef.current = store;
    setReady(true);
  }, []);

  return <StoryVisualization storeRef={storeRef} />;
};

export const MultiplePartnersWithHalfSiblings: StoryFn = () => {
  const storeRef = useRef<FamilyTreeStoreApi | null>(null);
  const [, setReady] = useState(false);

  useEffect(() => {
    const store = buildStore(
      [
        { id: 'mother', label: 'Mother', sex: 'female' },
        { id: 'father', label: 'Father', sex: 'male' },
        {
          id: 'additional-partner',
          label: "Father's Partner",
          sex: 'female',
        },
        { id: 'ego', label: 'You', sex: 'female', isEgo: true },
        { id: 'brother', label: 'Brother', sex: 'male' },
        { id: 'half-sister', label: 'Half-sister', sex: 'female' },
      ],
      [
        { source: 'father', target: 'mother', relationship: 'partner' },
        {
          source: 'father',
          target: 'additional-partner',
          relationship: 'partner',
        },
        { source: 'father', target: 'ego', relationship: 'parent' },
        { source: 'mother', target: 'ego', relationship: 'parent' },
        { source: 'father', target: 'brother', relationship: 'parent' },
        { source: 'mother', target: 'brother', relationship: 'parent' },
        {
          source: 'father',
          target: 'half-sister',
          relationship: 'parent',
        },
        {
          source: 'additional-partner',
          target: 'half-sister',
          relationship: 'parent',
        },
      ],
    );
    storeRef.current = store;
    setReady(true);
  }, []);

  return <StoryVisualization storeRef={storeRef} />;
};

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
    storeRef.current = store;
    setReady(true);
  }, []);

  return <StoryVisualization storeRef={storeRef} />;
};

export const ComplexMultiGenerational: StoryFn = () => {
  const storeRef = useRef<FamilyTreeStoreApi | null>(null);
  const [, setReady] = useState(false);

  useEffect(() => {
    const store = buildStore(
      [
        { id: 'ggf', label: 'Great-Grandfather', sex: 'male' },
        { id: 'ggm', label: 'Great-Grandmother', sex: 'female' },
        { id: 'pgf', label: 'Pat. Grandfather', sex: 'male' },
        { id: 'pgm', label: 'Pat. Grandmother', sex: 'female' },
        { id: 'pgf-partner2', label: "PGF's Partner 2", sex: 'female' },
        { id: 'mgf', label: 'Mat. Grandfather', sex: 'male' },
        { id: 'mgm', label: 'Mat. Grandmother', sex: 'female' },
        { id: 'father', label: 'Father', sex: 'male' },
        {
          id: 'father-partner2',
          label: "Father's Partner 2",
          sex: 'female',
        },
        { id: 'mother', label: 'Mother', sex: 'female' },
        { id: 'half-uncle', label: 'Pat. Half-Uncle', sex: 'male' },
        { id: 'aunt', label: 'Mat. Aunt', sex: 'female' },
        { id: 'aunt-h', label: "Aunt's Husband", sex: 'male' },
        { id: 'ego', label: 'You', sex: 'male', isEgo: true },
        { id: 'partner', label: 'Partner', sex: 'female' },
        { id: 'sister', label: 'Sister', sex: 'female' },
        { id: 'half-sis', label: 'Half-Sister', sex: 'female' },
        { id: 'cousin-f', label: 'Cousin (F)', sex: 'female' },
        { id: 'cousin-m', label: 'Cousin (M)', sex: 'male' },
        { id: 'son', label: 'Son', sex: 'male' },
        { id: 'daughter', label: 'Daughter', sex: 'female' },
      ],
      [
        { source: 'ggf', target: 'ggm', relationship: 'partner' },
        { source: 'ggf', target: 'pgf', relationship: 'parent' },
        { source: 'ggm', target: 'pgf', relationship: 'parent' },
        { source: 'pgf', target: 'pgm', relationship: 'partner' },
        { source: 'pgf', target: 'pgf-partner2', relationship: 'partner' },
        { source: 'mgf', target: 'mgm', relationship: 'partner' },
        { source: 'pgf', target: 'father', relationship: 'parent' },
        { source: 'pgm', target: 'father', relationship: 'parent' },
        { source: 'pgf', target: 'half-uncle', relationship: 'parent' },
        {
          source: 'pgf-partner2',
          target: 'half-uncle',
          relationship: 'parent',
        },
        { source: 'mgf', target: 'mother', relationship: 'parent' },
        { source: 'mgm', target: 'mother', relationship: 'parent' },
        { source: 'mgf', target: 'aunt', relationship: 'parent' },
        { source: 'mgm', target: 'aunt', relationship: 'parent' },
        { source: 'father', target: 'mother', relationship: 'partner' },
        {
          source: 'father',
          target: 'father-partner2',
          relationship: 'partner',
        },
        { source: 'aunt', target: 'aunt-h', relationship: 'partner' },
        { source: 'father', target: 'ego', relationship: 'parent' },
        { source: 'mother', target: 'ego', relationship: 'parent' },
        { source: 'father', target: 'sister', relationship: 'parent' },
        { source: 'mother', target: 'sister', relationship: 'parent' },
        { source: 'father', target: 'half-sis', relationship: 'parent' },
        {
          source: 'father-partner2',
          target: 'half-sis',
          relationship: 'parent',
        },
        { source: 'aunt', target: 'cousin-f', relationship: 'parent' },
        { source: 'aunt-h', target: 'cousin-f', relationship: 'parent' },
        { source: 'aunt', target: 'cousin-m', relationship: 'parent' },
        { source: 'aunt-h', target: 'cousin-m', relationship: 'parent' },
        { source: 'ego', target: 'partner', relationship: 'partner' },
        { source: 'ego', target: 'son', relationship: 'parent' },
        { source: 'partner', target: 'son', relationship: 'parent' },
        { source: 'ego', target: 'daughter', relationship: 'parent' },
        { source: 'partner', target: 'daughter', relationship: 'parent' },
      ],
    );
    storeRef.current = store;
    setReady(true);
  }, []);

  return <StoryVisualization storeRef={storeRef} />;
};

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

    store.getState().initializeMinimalNetwork();
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

  return <StoryVisualization storeRef={storeRef} />;
};

export const SimulatedHydration: StoryFn = () => {
  const storeRef = useRef<FamilyTreeStoreApi | null>(null);
  const [, setReady] = useState(false);

  useEffect(() => {
    const store = createFamilyTreeStore(new Map(), new Map());
    const state = store.getState();

    const reduxLikeNodes = [
      { id: 'mgm', label: 'Mat. Grandmother', sex: 'female' as const },
      { id: 'mgf', label: 'Mat. Grandfather', sex: 'male' as const },
      { id: 'pgm', label: 'Pat. Grandmother', sex: 'female' as const },
      { id: 'pgf', label: 'Pat. Grandfather', sex: 'male' as const },
      { id: 'mother', label: 'Mother', sex: 'female' as const },
      { id: 'father', label: 'Father', sex: 'male' as const },
      { id: 'uncle', label: 'Maternal Uncle', sex: 'male' as const },
      { id: 'aunt', label: 'Paternal Aunt', sex: 'female' as const },
      { id: 'ego', label: 'You', sex: 'male' as const, isEgo: true },
      { id: 'sister', label: 'Sister', sex: 'female' as const },
      { id: 'brother', label: 'Brother', sex: 'male' as const },
    ];

    for (const node of reduxLikeNodes) {
      state.addNode({
        id: node.id,
        label: node.label,
        sex: node.sex,
        isEgo: node.isEgo,
        readOnly: false,
        interviewNetworkId: node.id,
      });
    }

    const reduxLikeEdges = [
      { source: 'mgf', target: 'mgm', relationship: 'partner' as const },
      { source: 'pgf', target: 'pgm', relationship: 'partner' as const },
      { source: 'mgf', target: 'mother', relationship: 'parent' as const },
      { source: 'mgm', target: 'mother', relationship: 'parent' as const },
      { source: 'mgf', target: 'uncle', relationship: 'parent' as const },
      { source: 'mgm', target: 'uncle', relationship: 'parent' as const },
      { source: 'pgf', target: 'father', relationship: 'parent' as const },
      { source: 'pgm', target: 'father', relationship: 'parent' as const },
      { source: 'pgf', target: 'aunt', relationship: 'parent' as const },
      { source: 'pgm', target: 'aunt', relationship: 'parent' as const },
      {
        source: 'father',
        target: 'mother',
        relationship: 'partner' as const,
      },
      {
        source: 'father',
        target: 'ego',
        relationship: 'parent' as const,
      },
      {
        source: 'mother',
        target: 'ego',
        relationship: 'parent' as const,
      },
      {
        source: 'father',
        target: 'sister',
        relationship: 'parent' as const,
      },
      {
        source: 'mother',
        target: 'sister',
        relationship: 'parent' as const,
      },
      {
        source: 'father',
        target: 'brother',
        relationship: 'parent' as const,
      },
      {
        source: 'mother',
        target: 'brother',
        relationship: 'parent' as const,
      },
    ];

    for (let i = 0; i < reduxLikeEdges.length; i++) {
      const edge = reduxLikeEdges[i]!;
      state.addEdge({
        id: `edge-${i}`,
        source: edge.source,
        target: edge.target,
        relationship: edge.relationship,
      });
    }

    storeRef.current = store;
    setReady(true);
  }, []);

  return <StoryVisualization storeRef={storeRef} />;
};
