import { describe, expect, it } from 'vitest';
import { type FieldValue } from '~/lib/form/components/Field/types';
import { getAllParents } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/getAllParents';

function makeGetter(
  data: Record<string, FieldValue>,
): (name: string) => FieldValue | undefined {
  return (name: string) => data[name];
}

describe('getAllParents', () => {
  it('returns bio parents when no parents defined', () => {
    const result = getAllParents(makeGetter({}));
    // Always returns 2 bio parent entries (egg + sperm) even with no data
    expect(result).toHaveLength(2);
    expect(result[0]!.source).toBe('bioParents');
    expect(result[1]!.source).toBe('bioParents');
  });

  it('maps parent fields to AllParentEntry', () => {
    const result = getAllParents(
      makeGetter({
        'parentCount': '2',
        'parent-0-name': 'Mom',
        'parent-0-nameKnown': true,
        'parent-0-sex': 'female',
        'parent-1-name': 'Dad',
        'parent-1-nameKnown': true,
        'parent-1-sex': 'male',
      }),
    );
    // 2 parents + 2 bio parents
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({
      name: 'Mom',
      biologicalSex: 'female',
      source: 'parents',
      sourceIndex: 0,
      nameKnown: true,
    });
  });

  it('appends bio parents after regular parents', () => {
    const result = getAllParents(
      makeGetter({
        'parentCount': '1',
        'parent-0-name': 'Mom',
        'parent-0-nameKnown': true,
        'egg-parent.name': 'BioDad',
        'egg-parent.name-known': true,
        'egg-parent.sex-at-birth': 'female',
      }),
    );
    // 1 parent + 2 bio parents
    expect(result).toHaveLength(3);
    expect(result[1]!.source).toBe('bioParents');
    expect(result[1]!.sourceIndex).toBe(0);
    expect(result[1]!.name).toBe('BioDad');
  });

  it('uses empty string for bio parent name when nameKnown is false', () => {
    const result = getAllParents(
      makeGetter({
        'egg-parent.name': 'ignored',
        'egg-parent.name-known': false,
      }),
    );
    expect(result[0]!.name).toBe('');
    expect(result[0]!.nameKnown).toBe(false);
  });

  it('returns entries with nameKnown false for unnamed parents', () => {
    const result = getAllParents(
      makeGetter({
        'parentCount': '1',
        'parent-0-name': '',
        'parent-0-nameKnown': false,
      }),
    );
    expect(result[0]!.name).toBe('');
    expect(result[0]!.nameKnown).toBe(false);
  });
});
