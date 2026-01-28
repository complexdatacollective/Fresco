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

describe('buildBaseOptions - ex-partner support', () => {
  test('includes ex-partner option in base options', () => {
    /**
     * Users should be able to create ex-partners for family members.
     * This option should always be available in the base options.
     */
    const flags: RelationFlags = {
      hasAuntOrUncle: false,
      hasSiblings: false,
      hasChildren: false,
      hasParentExPartner: false,
    };
    const options = buildBaseOptions(flags);

    expect(options.some((opt) => opt.value === 'exPartner')).toBe(true);
  });

  test('ex-partner option has correct label', () => {
    const flags: RelationFlags = {
      hasAuntOrUncle: false,
      hasSiblings: false,
      hasChildren: false,
      hasParentExPartner: false,
    };
    const options = buildBaseOptions(flags);

    const exPartnerOption = options.find((opt) => opt.value === 'exPartner');
    expect(exPartnerOption?.label).toBe('Ex-Partner');
  });
});

describe('getRelationFlags - ex-partner detection', () => {
  test('detects when father has ex-partner', () => {
    /**
     * The flags should include hasParentExPartner to indicate
     * whether Father or Mother has an ex-partner.
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
          target: 'ex',
          relationship: 'ex-partner',
        },
      ],
    ]);

    const flags = getRelationFlags(nodes, edges, {
      fatherId: 'father',
      motherId: 'mother',
    });

    expect(flags.hasParentExPartner).toBe(true);
  });

  test('returns false when no ex-partners exist', () => {
    const nodes: FamilyTreeNodeType[] = [
      { id: 'ego', label: 'ego', sex: 'male', isEgo: true, readOnly: false },
    ];
    const edges = new Map<string, Edge>();

    const flags = getRelationFlags(nodes, edges, {
      fatherId: 'father',
      motherId: 'mother',
    });

    expect(flags.hasParentExPartner).toBe(false);
  });

  test('detects ex-partner when mother has ex-partner', () => {
    const nodes: FamilyTreeNodeType[] = [
      { id: 'mother', label: 'mother', sex: 'female', readOnly: false },
    ];
    const edges = new Map<string, Edge>([
      [
        'e1',
        {
          id: 'e1',
          source: 'ex-husband',
          target: 'mother',
          relationship: 'ex-partner',
        },
      ],
    ]);

    const flags = getRelationFlags(nodes, edges, {
      fatherId: 'father',
      motherId: 'mother',
    });

    expect(flags.hasParentExPartner).toBe(true);
  });

  test('returns false when ex-partner exists but not for father or mother', () => {
    /**
     * If an aunt has an ex-partner, half-sibling option should NOT show.
     * Only father/mother ex-partners matter for half-siblings.
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
          target: 'aunts-ex',
          relationship: 'ex-partner',
        },
      ],
    ]);

    const flags = getRelationFlags(nodes, edges, {
      fatherId: 'father',
      motherId: 'mother',
    });

    expect(flags.hasParentExPartner).toBe(false);
  });
});

describe('buildBaseOptions - conditional half-siblings', () => {
  test('excludes half-sibling options when no parent has ex-partner', () => {
    /**
     * Half-sibling options should only appear when an ex-partner exists.
     * Users should create an ex-partner first before adding half-siblings.
     */
    const flags: RelationFlags = {
      hasAuntOrUncle: false,
      hasSiblings: false,
      hasChildren: false,
      hasParentExPartner: false,
    };
    const options = buildBaseOptions(flags);

    expect(options.some((opt) => opt.value === 'halfSister')).toBe(false);
    expect(options.some((opt) => opt.value === 'halfBrother')).toBe(false);
  });

  test('includes half-sibling options when parent has ex-partner', () => {
    const flags: RelationFlags = {
      hasAuntOrUncle: false,
      hasSiblings: false,
      hasChildren: false,
      hasParentExPartner: true,
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
      hasParentExPartner: true,
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
      hasParentExPartner: false,
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
      hasParentExPartner: false,
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
      hasParentExPartner: false,
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
      hasParentExPartner: false,
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
      hasParentExPartner: true,
    };
    const options = buildBaseOptions(flags);

    expect(options.some((opt) => opt.value === 'niece')).toBe(true);
    expect(options.some((opt) => opt.value === 'nephew')).toBe(true);
  });
});
