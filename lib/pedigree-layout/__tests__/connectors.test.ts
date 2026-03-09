import { describe, expect, it } from 'vitest';
import { computeConnectors } from '~/lib/pedigree-layout/connectors';
import {
  type ParentConnection,
  type PedigreeLayout,
  type ScalingParams,
} from '~/lib/pedigree-layout/types';

describe('computeConnectors', () => {
  const scaling: ScalingParams = {
    boxWidth: 0.5,
    boxHeight: 0.5,
    legHeight: 0.25,
    hScale: 1,
    vScale: 1,
  };

  const layout: PedigreeLayout = {
    n: [2, 3],
    nid: [
      [1, 2, 0],
      [3, 4, 5],
    ],
    pos: [
      [0, 2, 0],
      [0, 1, 2],
    ],
    fam: [
      [0, 0, 0],
      [1, 1, 1],
    ],
    group: [
      [1, 0, 0],
      [0, 0, 0],
    ],
    twins: null,
  };

  const parents: ParentConnection[][] = [
    [],
    [],
    [],
    [
      { parentIndex: 1, edgeType: 'social-parent' },
      { parentIndex: 2, edgeType: 'social-parent' },
    ],
    [
      { parentIndex: 1, edgeType: 'social-parent' },
      { parentIndex: 2, edgeType: 'social-parent' },
    ],
    [
      { parentIndex: 1, edgeType: 'social-parent' },
      { parentIndex: 2, edgeType: 'social-parent' },
    ],
  ];

  it('produces parent group connectors', () => {
    const connectors = computeConnectors(layout, scaling, parents);
    expect(connectors.groupLines.length).toBeGreaterThan(0);
    expect(connectors.groupLines[0]!.type).toBe('parent-group');
  });

  it('produces parent-child connectors with edgeType', () => {
    const connectors = computeConnectors(layout, scaling, parents);
    expect(connectors.parentChildLines.length).toBeGreaterThan(0);
    expect(connectors.parentChildLines[0]!.edgeType).toBe('social-parent');
  });

  it('produces branched parent links (4 segments) when branch > 0', () => {
    const connectors = computeConnectors(layout, scaling, parents, 0.6);
    const pc = connectors.parentChildLines[0]!;
    expect(pc.parentLink.length).toBe(4);
  });

  it('produces 2 parent link segments when branch = 0', () => {
    const connectors = computeConnectors(layout, scaling, parents, 0);
    const pc = connectors.parentChildLines[0]!;
    expect(pc.parentLink.length).toBe(2);
  });

  it('group connector double flag reflects consanguinity', () => {
    const connectors = computeConnectors(layout, scaling, parents);
    expect(connectors.groupLines[0]!.double).toBe(false);
  });

  it('produces double line for consanguineous pairs', () => {
    const consLayout: PedigreeLayout = {
      ...layout,
      group: [
        [2, 0, 0],
        [0, 0, 0],
      ],
    };
    const connectors = computeConnectors(consLayout, scaling, parents);
    expect(connectors.groupLines[0]!.double).toBe(true);
    expect(connectors.groupLines[0]!.doubleSegment).toBeDefined();
  });

  it('produces duplicate arcs for repeated subjects', () => {
    const dupLayout: PedigreeLayout = {
      n: [3, 0],
      nid: [
        [1, 2, 1],
        [0, 0, 0],
      ],
      pos: [
        [0, 1, 3],
        [0, 0, 0],
      ],
      fam: [
        [0, 0, 0],
        [0, 0, 0],
      ],
      group: [
        [0, 0, 0],
        [0, 0, 0],
      ],
      twins: null,
    };
    const connectors = computeConnectors(dupLayout, scaling, []);
    expect(connectors.duplicateArcs.length).toBe(1);
    expect(connectors.duplicateArcs[0]!.personIndex).toBe(1);
    expect(connectors.duplicateArcs[0]!.path.dashed).toBe(true);
    expect(connectors.duplicateArcs[0]!.path.points.length).toBe(15);
  });

  it('produces auxiliary connectors for donor edges', () => {
    const donorLayout: PedigreeLayout = {
      n: [3, 1],
      nid: [
        [0, 1, 2],
        [3, 0, 0],
      ],
      pos: [
        [0, 1, 3],
        [0.5, 0, 0],
      ],
      fam: [
        [0, 0, 0],
        [1, 0, 0],
      ],
      group: [
        [1, 0, 0],
        [0, 0, 0],
      ],
      twins: null,
    };
    const donorParents: ParentConnection[][] = [
      [],
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'social-parent' },
        { parentIndex: 1, edgeType: 'social-parent' },
        { parentIndex: 2, edgeType: 'donor' },
      ],
    ];
    const connectors = computeConnectors(donorLayout, scaling, donorParents);
    expect(connectors.auxiliaryLines.length).toBe(1);
    expect(connectors.auxiliaryLines[0]!.edgeType).toBe('donor');
  });
});
