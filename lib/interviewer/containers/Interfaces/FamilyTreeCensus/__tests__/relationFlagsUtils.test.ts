import { describe, expect, test } from 'vitest';
import { type FamilyTreeNodeType } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import { type Edge } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/store';
import {
  buildBaseOptions,
  getRelationFlags,
  type RelationFlags,
} from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/utils/relationFlagsUtils';

/**
 * Tests for `getRelationFlags()` and `buildBaseOptions()` functions
 * from relationFlagsUtils.ts.
 */

describe('buildBaseOptions - additional partner support', () => {
  test('includes additional partner option in base options', () => {
    /**
     * Users should be able to create additional partners for family members.
     * This option should always be available in the base options.
     */
    const flags: RelationFlags = {
      hasAuntOrUncle: false,
      hasSiblings: false,
      hasChildren: false,
      hasParentWithMultiplePartners: false,
      hasGrandparentWithMultiplePartners: false,
    };
    const options = buildBaseOptions(flags);

    expect(options.some((opt) => opt.value === 'additionalPartner')).toBe(true);
  });

  test('additional partner option has correct label', () => {
    const flags: RelationFlags = {
      hasAuntOrUncle: false,
      hasSiblings: false,
      hasChildren: false,
      hasParentWithMultiplePartners: false,
      hasGrandparentWithMultiplePartners: false,
    };
    const options = buildBaseOptions(flags);

    const additionalPartnerOption = options.find(
      (opt) => opt.value === 'additionalPartner',
    );
    expect(additionalPartnerOption?.label).toBe('Additional Partner');
  });
});

describe('getRelationFlags - multiple partner detection', () => {
  test('detects when father has multiple partners', () => {
    /**
     * The flags should include hasParentWithMultiplePartners to indicate
     * whether Father or Mother has more than one partner.
     */
    const nodes: FamilyTreeNodeType[] = [
      { id: 'ego', label: 'ego', sex: 'male', isEgo: true, readOnly: false },
      { id: 'father', label: 'father', sex: 'male', readOnly: false },
    ];
    const edges = new Map<string, Edge>([
      [
        'e1',
        {
          id: 'e1',
          source: 'father',
          target: 'mother',
          relationship: 'partner',
        },
      ],
      [
        'e2',
        {
          id: 'e2',
          source: 'father',
          target: 'partner2',
          relationship: 'partner',
        },
      ],
    ]);

    const flags = getRelationFlags(nodes, edges, {
      fatherId: 'father',
      motherId: 'mother',
    });

    expect(flags.hasParentWithMultiplePartners).toBe(true);
  });

  test('returns false when parents have only one partner each', () => {
    const nodes: FamilyTreeNodeType[] = [
      { id: 'ego', label: 'ego', sex: 'male', isEgo: true, readOnly: false },
    ];
    const edges = new Map<string, Edge>([
      [
        'e1',
        {
          id: 'e1',
          source: 'father',
          target: 'mother',
          relationship: 'partner',
        },
      ],
    ]);

    const flags = getRelationFlags(nodes, edges, {
      fatherId: 'father',
      motherId: 'mother',
    });

    expect(flags.hasParentWithMultiplePartners).toBe(false);
  });

  test('detects when mother has multiple partners', () => {
    const nodes: FamilyTreeNodeType[] = [
      { id: 'mother', label: 'mother', sex: 'female', readOnly: false },
    ];
    const edges = new Map<string, Edge>([
      [
        'e1',
        {
          id: 'e1',
          source: 'father',
          target: 'mother',
          relationship: 'partner',
        },
      ],
      [
        'e2',
        {
          id: 'e2',
          source: 'partner2',
          target: 'mother',
          relationship: 'partner',
        },
      ],
    ]);

    const flags = getRelationFlags(nodes, edges, {
      fatherId: 'father',
      motherId: 'mother',
    });

    expect(flags.hasParentWithMultiplePartners).toBe(true);
  });

  test('returns false when multiple partners exist but not for father or mother', () => {
    /**
     * If an aunt has multiple partners, half-sibling option should NOT show.
     * Only father/mother partners matter for half-siblings.
     */
    const nodes: FamilyTreeNodeType[] = [
      { id: 'aunt', label: 'maternal aunt', sex: 'female', readOnly: false },
    ];
    const edges = new Map<string, Edge>([
      [
        'e1',
        {
          id: 'e1',
          source: 'aunt',
          target: 'aunts-partner1',
          relationship: 'partner',
        },
      ],
      [
        'e2',
        {
          id: 'e2',
          source: 'aunt',
          target: 'aunts-partner2',
          relationship: 'partner',
        },
      ],
    ]);

    const flags = getRelationFlags(nodes, edges, {
      fatherId: 'father',
      motherId: 'mother',
    });

    expect(flags.hasParentWithMultiplePartners).toBe(false);
  });
});

describe('buildBaseOptions - conditional half-siblings', () => {
  test('excludes half-sibling options when no parent has multiple partners', () => {
    /**
     * Half-sibling options should only appear when a parent has multiple partners.
     * Users should create an additional partner first before adding half-siblings.
     */
    const flags: RelationFlags = {
      hasAuntOrUncle: false,
      hasSiblings: false,
      hasChildren: false,
      hasParentWithMultiplePartners: false,
      hasGrandparentWithMultiplePartners: false,
    };
    const options = buildBaseOptions(flags);

    expect(options.some((opt) => opt.value === 'halfSister')).toBe(false);
    expect(options.some((opt) => opt.value === 'halfBrother')).toBe(false);
  });

  test('includes half-sibling options when parent has multiple partners', () => {
    const flags: RelationFlags = {
      hasAuntOrUncle: false,
      hasSiblings: false,
      hasChildren: false,
      hasParentWithMultiplePartners: true,
      hasGrandparentWithMultiplePartners: false,
    };
    const options = buildBaseOptions(flags);

    expect(options.some((opt) => opt.value === 'halfSister')).toBe(true);
    expect(options.some((opt) => opt.value === 'halfBrother')).toBe(true);
  });

  test('half-sibling options have correct labels', () => {
    const flags: RelationFlags = {
      hasAuntOrUncle: false,
      hasSiblings: false,
      hasChildren: false,
      hasParentWithMultiplePartners: true,
      hasGrandparentWithMultiplePartners: false,
    };
    const options = buildBaseOptions(flags);

    const halfSister = options.find((opt) => opt.value === 'halfSister');
    const halfBrother = options.find((opt) => opt.value === 'halfBrother');

    expect(halfSister?.label).toBe('Half Sister');
    expect(halfBrother?.label).toBe('Half Brother');
  });
});

describe('getRelationFlags - existing behavior', () => {
  test('detects aunts/uncles correctly', () => {
    const nodes: FamilyTreeNodeType[] = [
      { id: '1', label: 'maternal aunt', sex: 'female', readOnly: false },
      { id: '2', label: 'paternal uncle', sex: 'male', readOnly: false },
    ];

    const flags = getRelationFlags(nodes);

    expect(flags.hasAuntOrUncle).toBe(true);
  });

  test('detects children correctly', () => {
    const nodes: FamilyTreeNodeType[] = [
      { id: '1', label: 'son', sex: 'male', readOnly: false },
      { id: '2', label: 'daughter', sex: 'female', readOnly: false },
    ];

    const flags = getRelationFlags(nodes);

    expect(flags.hasChildren).toBe(true);
  });
});

describe('buildBaseOptions - existing conditional options', () => {
  test('includes cousin options when aunts/uncles exist', () => {
    const flags: RelationFlags = {
      hasAuntOrUncle: true,
      hasSiblings: false,
      hasChildren: false,
      hasParentWithMultiplePartners: false,
      hasGrandparentWithMultiplePartners: false,
    };
    const options = buildBaseOptions(flags);

    expect(options.some((opt) => opt.value === 'firstCousinMale')).toBe(true);
    expect(options.some((opt) => opt.value === 'firstCousinFemale')).toBe(true);
  });

  test('includes niece/nephew options when siblings exist', () => {
    const flags: RelationFlags = {
      hasAuntOrUncle: false,
      hasSiblings: true,
      hasChildren: false,
      hasParentWithMultiplePartners: false,
      hasGrandparentWithMultiplePartners: false,
    };
    const options = buildBaseOptions(flags);

    expect(options.some((opt) => opt.value === 'niece')).toBe(true);
    expect(options.some((opt) => opt.value === 'nephew')).toBe(true);
  });

  test('includes grandchildren options when children exist', () => {
    const flags: RelationFlags = {
      hasAuntOrUncle: false,
      hasSiblings: false,
      hasChildren: true,
      hasParentWithMultiplePartners: false,
      hasGrandparentWithMultiplePartners: false,
    };
    const options = buildBaseOptions(flags);

    expect(options.some((opt) => opt.value === 'granddaughter')).toBe(true);
    expect(options.some((opt) => opt.value === 'grandson')).toBe(true);
  });

  test('always includes base relation types', () => {
    const flags: RelationFlags = {
      hasAuntOrUncle: false,
      hasSiblings: false,
      hasChildren: false,
      hasParentWithMultiplePartners: false,
      hasGrandparentWithMultiplePartners: false,
    };
    const options = buildBaseOptions(flags);

    expect(options.some((opt) => opt.value === 'aunt')).toBe(true);
    expect(options.some((opt) => opt.value === 'uncle')).toBe(true);
    expect(options.some((opt) => opt.value === 'daughter')).toBe(true);
    expect(options.some((opt) => opt.value === 'son')).toBe(true);
    expect(options.some((opt) => opt.value === 'brother')).toBe(true);
    expect(options.some((opt) => opt.value === 'sister')).toBe(true);
  });
});

describe('getRelationFlags - half-sibling detection', () => {
  test('detects full siblings correctly', () => {
    const nodes: FamilyTreeNodeType[] = [
      { id: '1', label: 'brother', sex: 'male', readOnly: false },
      { id: '2', label: 'sister', sex: 'female', readOnly: false },
    ];

    const flags = getRelationFlags(nodes);

    expect(flags.hasSiblings).toBe(true);
  });

  test('detects half-siblings with space-separated labels', () => {
    /**
     * When nodes are created, formatRelationLabel() converts camelCase to
     * space-separated lowercase (e.g., 'halfBrother' -> 'half brother').
     * The hasSiblings check must match these actual label values.
     */
    const nodes: FamilyTreeNodeType[] = [
      { id: '1', label: 'half brother', sex: 'male', readOnly: false },
    ];

    const flags = getRelationFlags(nodes);

    expect(flags.hasSiblings).toBe(true);
  });

  test('detects half sister with space-separated label', () => {
    const nodes: FamilyTreeNodeType[] = [
      { id: '1', label: 'half sister', sex: 'female', readOnly: false },
    ];

    const flags = getRelationFlags(nodes);

    expect(flags.hasSiblings).toBe(true);
  });

  test('hasSiblings is false when no siblings exist', () => {
    const nodes: FamilyTreeNodeType[] = [
      { id: '1', label: 'father', sex: 'male', readOnly: false },
      { id: '2', label: 'mother', sex: 'female', readOnly: false },
    ];

    const flags = getRelationFlags(nodes);

    expect(flags.hasSiblings).toBe(false);
  });
});

describe('getRelationFlags - grandparent multiple partner detection', () => {
  test('detects when grandparent has multiple partners', () => {
    const nodes: FamilyTreeNodeType[] = [
      {
        id: 'maternal-grandmother',
        label: 'maternal grandmother',
        sex: 'female',
        readOnly: false,
      },
    ];
    const edges = new Map<string, Edge>([
      [
        'e1',
        {
          id: 'e1',
          source: 'maternal-grandfather',
          target: 'maternal-grandmother',
          relationship: 'partner',
        },
      ],
      [
        'e2',
        {
          id: 'e2',
          source: 'additional-partner',
          target: 'maternal-grandmother',
          relationship: 'partner',
        },
      ],
    ]);

    const flags = getRelationFlags(
      nodes,
      edges,
      { fatherId: 'father', motherId: 'mother' },
      { maternalGrandmotherId: 'maternal-grandmother' },
    );

    expect(flags.hasGrandparentWithMultiplePartners).toBe(true);
  });

  test('returns false when grandparents have only one partner each', () => {
    const nodes: FamilyTreeNodeType[] = [
      {
        id: 'maternal-grandmother',
        label: 'maternal grandmother',
        sex: 'female',
        readOnly: false,
      },
    ];
    const edges = new Map<string, Edge>([
      [
        'e1',
        {
          id: 'e1',
          source: 'maternal-grandfather',
          target: 'maternal-grandmother',
          relationship: 'partner',
        },
      ],
    ]);

    const flags = getRelationFlags(
      nodes,
      edges,
      { fatherId: 'father', motherId: 'mother' },
      { maternalGrandmotherId: 'maternal-grandmother' },
    );

    expect(flags.hasGrandparentWithMultiplePartners).toBe(false);
  });
});

describe('buildBaseOptions - conditional half-aunt/uncle', () => {
  test('excludes half-aunt/uncle options when no grandparent has multiple partners', () => {
    const flags: RelationFlags = {
      hasAuntOrUncle: false,
      hasSiblings: false,
      hasChildren: false,
      hasParentWithMultiplePartners: false,
      hasGrandparentWithMultiplePartners: false,
    };
    const options = buildBaseOptions(flags);

    expect(options.some((opt) => opt.value === 'halfAunt')).toBe(false);
    expect(options.some((opt) => opt.value === 'halfUncle')).toBe(false);
  });

  test('includes half-aunt/uncle options when grandparent has multiple partners', () => {
    const flags: RelationFlags = {
      hasAuntOrUncle: false,
      hasSiblings: false,
      hasChildren: false,
      hasParentWithMultiplePartners: false,
      hasGrandparentWithMultiplePartners: true,
    };
    const options = buildBaseOptions(flags);

    expect(options.some((opt) => opt.value === 'halfAunt')).toBe(true);
    expect(options.some((opt) => opt.value === 'halfUncle')).toBe(true);
  });

  test('half-aunt/uncle options have correct labels', () => {
    const flags: RelationFlags = {
      hasAuntOrUncle: false,
      hasSiblings: false,
      hasChildren: false,
      hasParentWithMultiplePartners: false,
      hasGrandparentWithMultiplePartners: true,
    };
    const options = buildBaseOptions(flags);

    const halfAunt = options.find((opt) => opt.value === 'halfAunt');
    const halfUncle = options.find((opt) => opt.value === 'halfUncle');

    expect(halfAunt?.label).toBe('Half Aunt');
    expect(halfUncle?.label).toBe('Half Uncle');
  });
});

describe('buildBaseOptions - niece/nephew with half-siblings', () => {
  test('includes niece/nephew when only half-siblings exist', () => {
    /**
     * This is the key test for the bug fix: niece/nephew options
     * should appear when half-siblings exist, not just full siblings.
     */
    const flags: RelationFlags = {
      hasAuntOrUncle: false,
      hasSiblings: true, // This should be true when half-siblings exist
      hasChildren: false,
      hasParentWithMultiplePartners: true,
      hasGrandparentWithMultiplePartners: false,
    };
    const options = buildBaseOptions(flags);

    expect(options.some((opt) => opt.value === 'niece')).toBe(true);
    expect(options.some((opt) => opt.value === 'nephew')).toBe(true);
  });
});
