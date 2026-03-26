import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import PedigreeLayout from '~/lib/pedigree-layout/components/PedigreeLayout';
import {
  type NodeData,
  type StoreEdge,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

const TEST_BIO_SEX_VAR = 'biologicalSex';

const DIMS = {
  nodeWidth: 100,
  nodeHeight: 100,
};

function makeNodes(
  entries: {
    id: string;
    biologicalSex?: string;
    isEgo?: boolean;
  }[],
) {
  const map = new Map<string, NodeData>();
  for (const { id, biologicalSex, isEgo } of entries) {
    const attributes: Record<string, unknown> = {};
    if (biologicalSex !== undefined) {
      attributes[TEST_BIO_SEX_VAR] = biologicalSex;
    }
    map.set(id, { attributes, isEgo: isEgo ?? false });
  }
  return map;
}

function makeEdges(entries: StoreEdge[]) {
  const map = new Map<string, StoreEdge>();
  entries.forEach((e, i) => {
    map.set(`e${i}`, e);
  });
  return map;
}

const renderNode = (node: { id: string }) => (
  <div data-testid={`node-${node.id}`}>{node.id}</div>
);

describe('PedigreeLayout', () => {
  test('shows spinner when nodeWidth is 0', () => {
    const nodes = makeNodes([
      { id: 'ego', isEgo: true, biologicalSex: 'male' },
    ]);
    const { container } = render(
      <PedigreeLayout
        nodes={nodes}
        edges={new Map()}
        biologicalSexVariable={TEST_BIO_SEX_VAR}
        {...DIMS}
        nodeWidth={0}
        renderNode={renderNode}
      />,
    );
    expect(container.querySelector('.flex.size-full')).not.toBeNull();
  });

  test('shows spinner when nodeHeight is 0', () => {
    const nodes = makeNodes([
      { id: 'ego', isEgo: true, biologicalSex: 'male' },
    ]);
    const { container } = render(
      <PedigreeLayout
        nodes={nodes}
        edges={new Map()}
        biologicalSexVariable={TEST_BIO_SEX_VAR}
        {...DIMS}
        nodeHeight={0}
        renderNode={renderNode}
      />,
    );
    expect(container.querySelector('.flex.size-full')).not.toBeNull();
  });

  test('renders nothing when nodes map is empty', () => {
    const { container } = render(
      <PedigreeLayout
        nodes={new Map()}
        edges={new Map()}
        biologicalSexVariable={TEST_BIO_SEX_VAR}
        {...DIMS}
        renderNode={renderNode}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  test('renders nodes for a simple family', () => {
    const nodes = makeNodes([
      { id: 'father', biologicalSex: 'male' },
      { id: 'mother', biologicalSex: 'female' },
      { id: 'ego', biologicalSex: 'male', isEgo: true },
    ]);
    const edges = makeEdges([
      {
        source: 'father',
        target: 'mother',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'father',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mother',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
    ]);

    render(
      <PedigreeLayout
        nodes={nodes}
        edges={edges}
        biologicalSexVariable={TEST_BIO_SEX_VAR}
        {...DIMS}
        renderNode={renderNode}
      />,
    );

    expect(screen.getByTestId('node-father')).toBeDefined();
    expect(screen.getByTestId('node-mother')).toBeDefined();
    expect(screen.getByTestId('node-ego')).toBeDefined();
  });

  test('positions nodes with absolute positioning', () => {
    const nodes = makeNodes([
      { id: 'father', biologicalSex: 'male' },
      { id: 'mother', biologicalSex: 'female' },
      { id: 'ego', biologicalSex: 'male', isEgo: true },
    ]);
    const edges = makeEdges([
      {
        source: 'father',
        target: 'mother',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'father',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mother',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
    ]);

    render(
      <PedigreeLayout
        nodes={nodes}
        edges={edges}
        biologicalSexVariable={TEST_BIO_SEX_VAR}
        {...DIMS}
        renderNode={renderNode}
      />,
    );

    const fatherNode = screen.getByTestId('node-father');
    const wrapper = fatherNode.parentElement!;
    expect(wrapper.style.top).toBeTruthy();
    expect(wrapper.style.left).toBeTruthy();
    expect(wrapper.className).toContain('absolute');
  });

  test('container has explicit width and height', () => {
    const nodes = makeNodes([
      { id: 'father', biologicalSex: 'male' },
      { id: 'mother', biologicalSex: 'female' },
      { id: 'ego', biologicalSex: 'male', isEgo: true },
    ]);
    const edges = makeEdges([
      {
        source: 'father',
        target: 'mother',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'father',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mother',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
    ]);

    const { container } = render(
      <PedigreeLayout
        nodes={nodes}
        edges={edges}
        biologicalSexVariable={TEST_BIO_SEX_VAR}
        {...DIMS}
        renderNode={renderNode}
      />,
    );

    const layout = container.firstElementChild as HTMLElement;
    expect(layout.style.width).toBeTruthy();
    expect(layout.style.height).toBeTruthy();
    expect(parseInt(layout.style.width)).toBeGreaterThan(0);
    expect(parseInt(layout.style.height)).toBeGreaterThan(0);
  });

  test('renders an SVG element for edges', () => {
    const nodes = makeNodes([
      { id: 'father', biologicalSex: 'male' },
      { id: 'mother', biologicalSex: 'female' },
      { id: 'ego', biologicalSex: 'male', isEgo: true },
    ]);
    const edges = makeEdges([
      {
        source: 'father',
        target: 'mother',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'father',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mother',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
    ]);

    const { container } = render(
      <PedigreeLayout
        nodes={nodes}
        edges={edges}
        biologicalSexVariable={TEST_BIO_SEX_VAR}
        {...DIMS}
        renderNode={renderNode}
      />,
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  test('calls renderNode with node id and data', () => {
    const nodes = makeNodes([
      { id: 'ego', biologicalSex: 'female', isEgo: true },
      { id: 'partner', biologicalSex: 'male' },
    ]);
    const edges = makeEdges([
      {
        source: 'ego',
        target: 'partner',
        relationshipType: 'partner',
        isActive: true,
      },
    ]);

    render(
      <PedigreeLayout
        nodes={nodes}
        edges={edges}
        biologicalSexVariable={TEST_BIO_SEX_VAR}
        {...DIMS}
        renderNode={(node) => (
          <div data-testid={`rendered-${node.id}`}>
            {`${node.id}-${String(node.attributes[TEST_BIO_SEX_VAR])}-${String(node.isEgo)}`}
          </div>
        )}
      />,
    );

    const rendered = screen.getByTestId('rendered-ego');
    expect(rendered.textContent).toBe('ego-female-true');
  });

  test('parent generation is above child generation', () => {
    const nodes = makeNodes([
      { id: 'father', biologicalSex: 'male' },
      { id: 'mother', biologicalSex: 'female' },
      { id: 'ego', biologicalSex: 'male', isEgo: true },
    ]);
    const edges = makeEdges([
      {
        source: 'father',
        target: 'mother',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        source: 'father',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        source: 'mother',
        target: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
    ]);

    render(
      <PedigreeLayout
        nodes={nodes}
        edges={edges}
        biologicalSexVariable={TEST_BIO_SEX_VAR}
        {...DIMS}
        renderNode={renderNode}
      />,
    );

    const fatherWrapper = screen.getByTestId('node-father').parentElement!;
    const egoWrapper = screen.getByTestId('node-ego').parentElement!;

    const fatherY = parseInt(fatherWrapper.style.top);
    const egoY = parseInt(egoWrapper.style.top);

    expect(fatherY).toBeLessThan(egoY);
  });
});
