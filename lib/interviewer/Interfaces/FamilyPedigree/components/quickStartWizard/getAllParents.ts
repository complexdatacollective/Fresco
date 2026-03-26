import {
  type BioParentDetail,
  type ParentDetail,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

export type AllParentEntry = {
  name: string;
  biologicalSex?: string;
  source: 'parents' | 'bioParents';
  sourceIndex: number;
  nameKnown: boolean;
};

export function getAllParents(data: Record<string, unknown>): AllParentEntry[] {
  const parents = (data.parents as ParentDetail[] | undefined) ?? [];
  const bioParents = (data.bioParents as BioParentDetail[] | undefined) ?? [];

  const entries: AllParentEntry[] = parents.map((p, i) => ({
    name: p.name,
    biologicalSex: p.biologicalSex,
    source: 'parents' as const,
    sourceIndex: i,
    nameKnown: p.nameKnown,
  }));

  for (let i = 0; i < bioParents.length; i++) {
    const bp = bioParents[i]!;
    entries.push({
      name: bp.nameKnown ? bp.name : '',
      biologicalSex: bp.biologicalSex,
      source: 'bioParents',
      sourceIndex: i,
      nameKnown: bp.nameKnown,
    });
  }

  return entries;
}

export function getParentDisplayName(
  entry: AllParentEntry,
  index: number,
): string {
  return entry.nameKnown && entry.name ? entry.name : `Parent ${index + 1}`;
}
