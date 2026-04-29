import { type NcEdge, type NcNode } from '@codaco/shared-consts';
import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { type VariableConfig } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import PedigreeLayout from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/components/PedigreeLayout';

const variableConfig: VariableConfig = {
  nodeType: 'person',
  edgeType: 'family',
  nodeLabelVariable: 'name',
  egoVariable: 'isEgo',
  relationshipTypeVariable: 'rel',
  isActiveVariable: 'active',
  isGestationalCarrierVariable: 'gc',
};

const DIMS = {
  nodeWidth: 100,
  nodeHeight: 100,
};

function makeNodes(
  entries: {
    id: string;
    isEgo?: boolean;
  }[],
): Map<string, NcNode> {
  const map = new Map<string, NcNode>();
  for (const { id, isEgo } of entries) {
    map.set(id, {
      _uid: id,
      type: 'person',
      attributes: {
        [variableConfig.egoVariable]: isEgo ?? false,
      },
    });
  }
  return map;
}

function makeEdges(
  entries: {
    from: string;
    to: string;
    relationshipType: string;
    isActive: boolean;
  }[],
): Map<string, NcEdge> {
  const map = new Map<string, NcEdge>();
  entries.forEach((e, i) => {
    map.set(`e${i}`, {
      _uid: `e${i}`,
      type: 'family',
      from: e.from,
      to: e.to,
      attributes: {
        [variableConfig.relationshipTypeVariable]: e.relationshipType,
        [variableConfig.isActiveVariable]: e.isActive,
      },
    });
  });
  return map;
}

const renderNode = (node: NcNode & { id: string }) => (
  <div data-testid={`node-${node.id}`}>{node.id}</div>
);

describe('PedigreeLayout', () => {
  test('shows spinner when nodeWidth is 0', () => {
    const nodes = makeNodes([{ id: 'ego', isEgo: true }]);
    const { container } = render(
      <PedigreeLayout
        nodes={nodes}
        edges={new Map()}
        variableConfig={variableConfig}
        {...DIMS}
        nodeWidth={0}
        renderNode={renderNode}
      />,
    );
    expect(container.querySelector('.flex.size-full')).not.toBeNull();
  });

  test('shows spinner when nodeHeight is 0', () => {
    const nodes = makeNodes([{ id: 'ego', isEgo: true }]);
    const { container } = render(
      <PedigreeLayout
        nodes={nodes}
        edges={new Map()}
        variableConfig={variableConfig}
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
        variableConfig={variableConfig}
        {...DIMS}
        renderNode={renderNode}
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  test('renders nodes for a simple family', () => {
    const nodes = makeNodes([
      { id: 'father' },
      { id: 'mother' },
      { id: 'ego', isEgo: true },
    ]);
    const edges = makeEdges([
      {
        from: 'father',
        to: 'mother',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        from: 'father',
        to: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        from: 'mother',
        to: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
    ]);

    render(
      <PedigreeLayout
        nodes={nodes}
        edges={edges}
        variableConfig={variableConfig}
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
      { id: 'father' },
      { id: 'mother' },
      { id: 'ego', isEgo: true },
    ]);
    const edges = makeEdges([
      {
        from: 'father',
        to: 'mother',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        from: 'father',
        to: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        from: 'mother',
        to: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
    ]);

    render(
      <PedigreeLayout
        nodes={nodes}
        edges={edges}
        variableConfig={variableConfig}
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
      { id: 'father' },
      { id: 'mother' },
      { id: 'ego', isEgo: true },
    ]);
    const edges = makeEdges([
      {
        from: 'father',
        to: 'mother',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        from: 'father',
        to: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        from: 'mother',
        to: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
    ]);

    const { container } = render(
      <PedigreeLayout
        nodes={nodes}
        edges={edges}
        variableConfig={variableConfig}
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
      { id: 'father' },
      { id: 'mother' },
      { id: 'ego', isEgo: true },
    ]);
    const edges = makeEdges([
      {
        from: 'father',
        to: 'mother',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        from: 'father',
        to: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        from: 'mother',
        to: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
    ]);

    const { container } = render(
      <PedigreeLayout
        nodes={nodes}
        edges={edges}
        variableConfig={variableConfig}
        {...DIMS}
        renderNode={renderNode}
      />,
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  test('calls renderNode with node id and data', () => {
    const nodes = makeNodes([{ id: 'ego', isEgo: true }, { id: 'partner' }]);
    const edges = makeEdges([
      {
        from: 'ego',
        to: 'partner',
        relationshipType: 'partner',
        isActive: true,
      },
    ]);

    render(
      <PedigreeLayout
        nodes={nodes}
        edges={edges}
        variableConfig={variableConfig}
        {...DIMS}
        renderNode={(node) => (
          <div data-testid={`rendered-${node.id}`}>
            {`${node.id}-${node.attributes[variableConfig.egoVariable] === true ? 'true' : 'false'}`}
          </div>
        )}
      />,
    );

    const rendered = screen.getByTestId('rendered-ego');
    expect(rendered.textContent).toBe('ego-true');
  });

  test('parent generation is above child generation', () => {
    const nodes = makeNodes([
      { id: 'father' },
      { id: 'mother' },
      { id: 'ego', isEgo: true },
    ]);
    const edges = makeEdges([
      {
        from: 'father',
        to: 'mother',
        relationshipType: 'partner',
        isActive: true,
      },
      {
        from: 'father',
        to: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
      {
        from: 'mother',
        to: 'ego',
        relationshipType: 'biological',
        isActive: true,
      },
    ]);

    render(
      <PedigreeLayout
        nodes={nodes}
        edges={edges}
        variableConfig={variableConfig}
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
