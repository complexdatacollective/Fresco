import { describe, expect, it } from 'vitest';
import { computeConnectors } from '~/lib/pedigree-layout/connectors';
import {
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
    spouse: [
      [1, 0, 0],
      [0, 0, 0],
    ],
    twins: null,
  };

  it('produces spouse connectors for spouse pairs', () => {
    const connectors = computeConnectors(layout, scaling);
    expect(connectors.spouseLines.length).toBeGreaterThan(0);
    expect(connectors.spouseLines[0]!.type).toBe('spouse');
  });

  it('produces parent-child connectors', () => {
    const connectors = computeConnectors(layout, scaling);
    expect(connectors.parentChildLines.length).toBeGreaterThan(0);
    expect(connectors.parentChildLines[0]!.type).toBe('parent-child');
  });

  it('produces branched parent links (3 segments) when branch > 0', () => {
    const connectors = computeConnectors(layout, scaling, 0.6);
    const pc = connectors.parentChildLines[0]!;
    expect(pc.parentLink.length).toBe(3);
  });

  it('produces single parent link when branch = 0', () => {
    const connectors = computeConnectors(layout, scaling, 0);
    const pc = connectors.parentChildLines[0]!;
    expect(pc.parentLink.length).toBe(1);
  });

  it('spouse connector double flag reflects consanguinity', () => {
    const connectors = computeConnectors(layout, scaling);
    // Our test layout has spouse=1 (not consanguineous)
    expect(connectors.spouseLines[0]!.double).toBe(false);
  });

  it('produces double line for consanguineous pairs', () => {
    const consLayout: PedigreeLayout = {
      ...layout,
      spouse: [
        [2, 0, 0],
        [0, 0, 0],
      ],
    };
    const connectors = computeConnectors(consLayout, scaling);
    expect(connectors.spouseLines[0]!.double).toBe(true);
    expect(connectors.spouseLines[0]!.doubleSegment).toBeDefined();
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
      spouse: [
        [0, 0, 0],
        [0, 0, 0],
      ],
      twins: null,
    };
    const connectors = computeConnectors(dupLayout, scaling);
    expect(connectors.duplicateArcs.length).toBe(1);
    expect(connectors.duplicateArcs[0]!.personIndex).toBe(1);
    expect(connectors.duplicateArcs[0]!.path.dashed).toBe(true);
    expect(connectors.duplicateArcs[0]!.path.points.length).toBe(15);
  });
});
