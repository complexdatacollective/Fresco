import { describe, expect, it } from 'vitest';
import { getAllParents } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/getAllParents';

describe('getAllParents', () => {
  it('returns empty array when no parents or bioParents', () => {
    expect(getAllParents({})).toEqual([]);
  });

  it('maps data.parents entries to AllParentEntry', () => {
    const result = getAllParents({
      parents: [
        {
          name: 'Mom',
          nameKnown: true,
          edgeType: 'biological',
          biological: true,
        },
        {
          name: 'Dad',
          nameKnown: true,
          edgeType: 'biological',
          biological: true,
        },
      ],
    });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: 'Mom',
      biologicalSex: undefined,
      source: 'parents',
      sourceIndex: 0,
      nameKnown: true,
    });
  });

  it('appends bioParents after parents', () => {
    const result = getAllParents({
      parents: [{ name: 'Mom', nameKnown: true, edgeType: 'biological' }],
      bioParents: [{ name: 'BioDad', nameKnown: true }],
    });
    expect(result).toHaveLength(2);
    expect(result[1]!.source).toBe('bioParents');
    expect(result[1]!.sourceIndex).toBe(0);
    expect(result[1]!.name).toBe('BioDad');
  });

  it('uses empty string for bioParent name when nameKnown is false', () => {
    const result = getAllParents({
      bioParents: [{ name: 'ignored', nameKnown: false }],
    });
    expect(result[0]!.name).toBe('');
    expect(result[0]!.nameKnown).toBe(false);
  });

  it('returns display label with fallback for unnamed parents', () => {
    const result = getAllParents({
      parents: [{ name: '', nameKnown: false, edgeType: 'biological' }],
    });
    expect(result[0]!.name).toBe('');
    expect(result[0]!.nameKnown).toBe(false);
  });
});
