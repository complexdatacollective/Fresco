import { describe, expect, it } from 'vitest';
import { computeConnectors } from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/connectors';
import {
  type ParentConnection,
  type PedigreeLayout,
  type ScalingParams,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/types';

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
    groupMember: [
      [false, false, false],
      [false, false, false],
    ],
  };

  const parents: ParentConnection[][] = [
    [],
    [],
    [],
    [
      { parentIndex: 1, edgeType: 'biological' },
      { parentIndex: 2, edgeType: 'biological' },
    ],
    [
      { parentIndex: 1, edgeType: 'biological' },
      { parentIndex: 2, edgeType: 'biological' },
    ],
    [
      { parentIndex: 1, edgeType: 'biological' },
      { parentIndex: 2, edgeType: 'biological' },
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
    expect(connectors.parentChildLines[0]!.edgeType).toBe('biological');
  });

  it('produces branched parent links (4 segments) when branch > 0', () => {
    const connectors = computeConnectors(
      layout,
      scaling,
      parents,
      undefined,
      0.6,
    );
    const pc = connectors.parentChildLines[0]!;
    expect(pc.parentLink.length).toBe(4);
  });

  it('produces 2 parent link segments when branch = 0', () => {
    const connectors = computeConnectors(
      layout,
      scaling,
      parents,
      undefined,
      0,
    );
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
      groupMember: [
        [false, false, false],
        [false, false, false],
      ],
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
      groupMember: [
        [false, false, false],
        [false, false, false],
      ],
    };
    const donorParents: ParentConnection[][] = [
      [],
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'biological' },
        { parentIndex: 2, edgeType: 'donor' },
      ],
    ];
    const connectors = computeConnectors(donorLayout, scaling, donorParents);
    expect(connectors.auxiliaryLines.length).toBe(1);
    expect(connectors.auxiliaryLines[0]!.edgeType).toBe('donor');
    expect(connectors.auxiliaryLines[0]!.segment).toBeDefined();
  });

  it('routes parent links to specific couple midpoints in multi-partner layouts', () => {
    const multiLayout: PedigreeLayout = {
      n: [3, 2],
      nid: [
        [1, 0, 2],
        [3, 4, 0],
      ],
      pos: [
        [0, 1, 2],
        [0.5, 1.5, 0],
      ],
      fam: [
        [0, 0, 0],
        [1, 2, 0],
      ],
      group: [
        [1, 1, 0],
        [0, 0, 0],
      ],
      twins: null,
      groupMember: [
        [false, false, false],
        [false, false, false],
      ],
    };

    const multiParents: ParentConnection[][] = [
      [],
      [],
      [],
      [
        { parentIndex: 1, edgeType: 'biological' },
        { parentIndex: 0, edgeType: 'biological' },
      ],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 2, edgeType: 'biological' },
      ],
    ];

    const connectors = computeConnectors(multiLayout, scaling, multiParents);

    expect(connectors.parentChildLines.length).toBe(2);

    const pc1 = connectors.parentChildLines[0]!;
    const pc1ParentX = pc1.parentLink[0]!.x1;
    expect(pc1ParentX).toBeCloseTo(0.5, 1);

    const pc2 = connectors.parentChildLines[1]!;
    const pc2ParentX = pc2.parentLink[0]!.x1;
    expect(pc2ParentX).toBeCloseTo(1.5, 1);
  });

  it('produces auxiliary connectors for unpartnered-parent edges', () => {
    const bioLayout: PedigreeLayout = {
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
      groupMember: [
        [false, false, false],
        [false, false, false],
      ],
    };
    const bioParents: ParentConnection[][] = [
      [],
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'biological' },
        { parentIndex: 2, edgeType: 'biological' },
      ],
    ];
    const connectors = computeConnectors(bioLayout, scaling, bioParents);
    expect(connectors.auxiliaryLines.length).toBe(1);
    expect(connectors.auxiliaryLines[0]!.edgeType).toBe('biological');
  });

  it('marks group lines as active when no activePartnerPairs provided', () => {
    const connectors = computeConnectors(layout, scaling, parents);
    expect(connectors.groupLines[0]!.isActive).toBe(true);
  });

  it('marks group lines as inactive for non-active partner pairs', () => {
    const activePairs = new Set<string>();
    const connectors = computeConnectors(layout, scaling, parents, activePairs);
    expect(connectors.groupLines.length).toBe(1);
    expect(connectors.groupLines[0]!.isActive).toBe(false);
  });

  it('marks group lines as active for active partner pairs', () => {
    const activePairs = new Set(['1,2']);
    const connectors = computeConnectors(layout, scaling, parents, activePairs);
    expect(connectors.groupLines.length).toBe(1);
    expect(connectors.groupLines[0]!.isActive).toBe(true);
  });

  it('descends from genetic contributor when only one parent is biological', () => {
    // Parent 0 (biological) at pos 0, Parent 1 (social) at pos 2
    const socialLayout: PedigreeLayout = {
      n: [2, 1],
      nid: [
        [0, 1],
        [2, 0],
      ],
      pos: [
        [0, 2],
        [1, 0],
      ],
      fam: [
        [0, 0],
        [1, 0],
      ],
      group: [
        [1, 0],
        [0, 0],
      ],
      twins: null,
      groupMember: [
        [false, false],
        [false, false],
      ],
    };
    const socialParents: ParentConnection[][] = [
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'social' },
      ],
    ];
    const connectors = computeConnectors(socialLayout, scaling, socialParents);
    const pc = connectors.parentChildLines[0]!;
    // Descent should be from parent 0's position (x=0), not midpoint (x=1)
    expect(pc.parentLink[0]!.x1).toBeCloseTo(0, 1);
  });

  it('descends from couple midpoint when both parents are biological', () => {
    const connectors = computeConnectors(layout, scaling, parents);
    const pc = connectors.parentChildLines[0]!;
    // Both parents biological: midpoint of pos 0 and 2 = 1
    expect(pc.parentLink[0]!.x1).toBeCloseTo(1, 1);
  });

  it('auxiliary connector connects to sibling bar when donor is parent of ALL siblings', () => {
    // 2 parents (0,1) + 1 donor (2) + 2 children (3,4)
    // Donor has donor edges to BOTH children
    const donorAllLayout: PedigreeLayout = {
      n: [3, 2],
      nid: [
        [0, 1, 2],
        [3, 4, 0],
      ],
      pos: [
        [0, 1, 3],
        [0, 1, 0],
      ],
      fam: [
        [0, 0, 0],
        [1, 1, 0],
      ],
      group: [
        [1, 0, 0],
        [0, 0, 0],
      ],
      twins: null,
      groupMember: [
        [false, false, false],
        [false, false, false],
      ],
    };
    const donorAllParents: ParentConnection[][] = [
      [],
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'biological' },
        { parentIndex: 2, edgeType: 'donor' },
      ],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'biological' },
        { parentIndex: 2, edgeType: 'donor' },
      ],
    ];
    const connectors = computeConnectors(
      donorAllLayout,
      scaling,
      donorAllParents,
    );
    expect(connectors.auxiliaryLines.length).toBe(1);
    // Sibling bar y = childLevel(1) - legh(0.25) = 0.75
    expect(connectors.auxiliaryLines[0]!.segment.y2).toBeCloseTo(0.75, 5);
  });

  it('auxiliary connector connects directly to child when donor is parent of only SOME siblings', () => {
    // 2 parents (0,1) + 2 donors (2,3) + 2 children (4,5)
    // Donor2 has donor edge to child4 only, Donor3 has donor edge to child5 only
    const donorSomeLayout: PedigreeLayout = {
      n: [4, 2],
      nid: [
        [0, 1, 2, 3],
        [4, 5, 0, 0],
      ],
      pos: [
        [0, 1, 3, 4],
        [0, 1, 0, 0],
      ],
      fam: [
        [0, 0, 0, 0],
        [1, 1, 0, 0],
      ],
      group: [
        [1, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      twins: null,
      groupMember: [
        [false, false, false, false],
        [false, false, false, false],
      ],
    };
    const donorSomeParents: ParentConnection[][] = [
      [],
      [],
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'biological' },
        { parentIndex: 2, edgeType: 'donor' },
      ],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'biological' },
        { parentIndex: 3, edgeType: 'donor' },
      ],
    ];
    const connectors = computeConnectors(
      donorSomeLayout,
      scaling,
      donorSomeParents,
    );
    expect(connectors.auxiliaryLines.length).toBe(2);
    // Each connects directly to child: y = childLevel(1) + boxh/2(0.25) = 1.25
    expect(connectors.auxiliaryLines[0]!.segment.y2).toBeCloseTo(1.25, 5);
    expect(connectors.auxiliaryLines[1]!.segment.y2).toBeCloseTo(1.25, 5);
  });

  it('auxiliary connector connects directly to child when single child in family', () => {
    // 2 parents (0,1) + 1 donor (2) + 1 child (3) — same as existing fixture
    const singleChildLayout: PedigreeLayout = {
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
      groupMember: [
        [false, false, false],
        [false, false, false],
      ],
    };
    const singleChildParents: ParentConnection[][] = [
      [],
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'biological' },
        { parentIndex: 2, edgeType: 'donor' },
      ],
    ];
    const connectors = computeConnectors(
      singleChildLayout,
      scaling,
      singleChildParents,
    );
    expect(connectors.auxiliaryLines.length).toBe(1);
    // Single child: connects directly to child node y = 1 + 0.25 = 1.25
    expect(connectors.auxiliaryLines[0]!.segment.y2).toBeCloseTo(1.25, 5);
  });

  it('social parent connector connects to sibling bar when social parent of ALL siblings', () => {
    // mom(0) + stepdad(1) couple, biodad(2) is biological to both children
    // stepdad(1) is social parent of both children (3,4)
    // biodad(2) is unpartnered biological parent of both children
    const socialAllLayout: PedigreeLayout = {
      n: [3, 2],
      nid: [
        [0, 1, 2],
        [3, 4, 0],
      ],
      pos: [
        [0, 1, 3],
        [0, 1, 0],
      ],
      fam: [
        [0, 0, 0],
        [1, 1, 0],
      ],
      group: [
        [1, 0, 0],
        [0, 0, 0],
      ],
      twins: null,
      groupMember: [
        [false, false, false],
        [false, false, false],
      ],
    };
    const socialAllParents: ParentConnection[][] = [
      [],
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'social' },
        { parentIndex: 2, edgeType: 'biological' },
      ],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'social' },
        { parentIndex: 2, edgeType: 'biological' },
      ],
    ];
    const activePairs = new Set(['0,1']);
    const connectors = computeConnectors(
      socialAllLayout,
      scaling,
      socialAllParents,
      activePairs,
    );
    const bioAux = connectors.auxiliaryLines.filter(
      (l) => l.edgeType === 'biological',
    );
    expect(bioAux.length).toBe(1);
    // Connects to sibling bar y = 1 - 0.25 = 0.75
    expect(bioAux[0]!.segment.y2).toBeCloseTo(0.75, 5);
  });

  it('social parent connector connects directly to child when social parent of only SOME siblings', () => {
    // mom(0) + stepdad(1) couple, biodad1(2) bio to child3 only, biodad2(3) bio to child4 only
    const socialSomeLayout: PedigreeLayout = {
      n: [4, 2],
      nid: [
        [0, 1, 2, 3],
        [4, 5, 0, 0],
      ],
      pos: [
        [0, 1, 3, 4],
        [0, 1, 0, 0],
      ],
      fam: [
        [0, 0, 0, 0],
        [1, 1, 0, 0],
      ],
      group: [
        [1, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      twins: null,
      groupMember: [
        [false, false, false, false],
        [false, false, false, false],
      ],
    };
    const socialSomeParents: ParentConnection[][] = [
      [],
      [],
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'social' },
        { parentIndex: 2, edgeType: 'biological' },
      ],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'social' },
        { parentIndex: 3, edgeType: 'biological' },
      ],
    ];
    const activePairs = new Set(['0,1']);
    const connectors = computeConnectors(
      socialSomeLayout,
      scaling,
      socialSomeParents,
      activePairs,
    );
    const bioAux = connectors.auxiliaryLines.filter(
      (l) => l.edgeType === 'biological',
    );
    expect(bioAux.length).toBe(2);
    // Each connects directly to child: y = 1 + 0.25 = 1.25
    expect(bioAux[0]!.segment.y2).toBeCloseTo(1.25, 5);
    expect(bioAux[1]!.segment.y2).toBeCloseTo(1.25, 5);
  });

  it('slashSide is set correctly for inactive group lines', () => {
    // biodad(0) inactive partner with mom(1), mom(1) active partner with stepdad(2)
    // child(3) from biodad+mom
    const blendedLayout: PedigreeLayout = {
      n: [3, 1],
      nid: [
        [0, 1, 2],
        [3, 0, 0],
      ],
      pos: [
        [0, 1, 2],
        [0.5, 0, 0],
      ],
      fam: [
        [0, 0, 0],
        [1, 0, 0],
      ],
      group: [
        [1, 1, 0],
        [0, 0, 0],
      ],
      twins: null,
      groupMember: [
        [false, false, false],
        [false, false, false],
      ],
    };
    const blendedParents: ParentConnection[][] = [
      [],
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'biological' },
      ],
    ];
    // mom(1)+stepdad(2) is active, biodad(0)+mom(1) is inactive
    const activePairs = new Set(['1,2']);
    const connectors = computeConnectors(
      blendedLayout,
      scaling,
      blendedParents,
      activePairs,
    );

    const inactiveLine = connectors.groupLines.find((g) => !g.isActive);
    expect(inactiveLine).toBeDefined();
    // biodad(0) has no active relationship → slash goes on left (biodad's side)
    expect(inactiveLine!.slashSide).toBe('left');
  });

  it('treats adoptive edges as primary', () => {
    // adoptiveMom(0) + adoptiveDad(1) as couple, bioMom(2) separate, child(3)
    const adoptiveLayout: PedigreeLayout = {
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
      groupMember: [
        [false, false, false],
        [false, false, false],
      ],
    };
    const adoptiveParents: ParentConnection[][] = [
      [],
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'adoptive' },
        { parentIndex: 1, edgeType: 'adoptive' },
        { parentIndex: 2, edgeType: 'biological' },
      ],
    ];
    const connectors = computeConnectors(
      adoptiveLayout,
      scaling,
      adoptiveParents,
    );
    expect(connectors.parentChildLines.length).toBeGreaterThan(0);
    expect(connectors.parentChildLines[0]!.edgeType).toBe('adoptive');
  });

  it('uses standard parent link (not diagonal joins) for inactive partnerships', () => {
    // Two parents, inactive partnership, one child
    const inactiveLayout: PedigreeLayout = {
      n: [2, 1],
      nid: [
        [0, 1],
        [2, 0],
      ],
      pos: [
        [0, 2],
        [1, 0],
      ],
      fam: [
        [0, 0],
        [1, 0],
      ],
      group: [
        [1, 0],
        [0, 0],
      ],
      twins: null,
      groupMember: [
        [false, false],
        [false, false],
      ],
    };
    const inactiveParents: ParentConnection[][] = [
      [],
      [],
      [
        { parentIndex: 0, edgeType: 'biological' },
        { parentIndex: 1, edgeType: 'biological' },
      ],
    ];
    // Empty active set = no active partners
    const activePairs = new Set<string>();
    const connectors = computeConnectors(
      inactiveLayout,
      scaling,
      inactiveParents,
      activePairs,
    );
    const pc = connectors.parentChildLines[0]!;
    // Should produce standard branched parent link (4 segments), not diagonal joins
    expect(pc.parentLink.length).toBe(4);
    // Parent link should descend from couple midpoint (both biological)
    expect(pc.parentLink[0]!.x1).toBeCloseTo(1, 1);
  });
});
