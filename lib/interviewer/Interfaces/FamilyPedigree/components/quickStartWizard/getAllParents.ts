import { type FieldValue } from '~/lib/form/components/Field/types';

type GetFieldValue = (name: string) => FieldValue | undefined;

type AllParentEntry = {
  name: string;
  biologicalSex?: string;
  source: 'parents' | 'bioParents';
  sourceIndex: number;
  nameKnown: boolean;
};

export function getAllParents(getFieldValue: GetFieldValue): AllParentEntry[] {
  const parentCount = Number(getFieldValue('parentCount') ?? 0);

  const entries: AllParentEntry[] = Array.from(
    { length: parentCount },
    (_, i) => ({
      name: (getFieldValue(`parent-${i}-name`) as string | undefined) ?? '',
      biologicalSex: getFieldValue(`parent-${i}-sex`) as string | undefined,
      source: 'parents' as const,
      sourceIndex: i,
      nameKnown: Boolean(getFieldValue(`parent-${i}-nameKnown`)),
    }),
  );

  const eggName = getFieldValue('egg-parent.name') as string | undefined;
  const eggNameKnown = getFieldValue('egg-parent.name-known');
  const eggSex = getFieldValue('egg-parent.sex-at-birth') as string | undefined;

  entries.push({
    name: eggNameKnown ? (eggName ?? '') : '',
    biologicalSex: eggSex,
    source: 'bioParents',
    sourceIndex: 0,
    nameKnown: Boolean(eggNameKnown),
  });

  const spermName = getFieldValue('sperm-parent.name') as string | undefined;
  const spermNameKnown = getFieldValue('sperm-parent.name-known');
  const spermSex = getFieldValue('sperm-parent.sex-at-birth') as
    | string
    | undefined;

  entries.push({
    name: spermNameKnown ? (spermName ?? '') : '',
    biologicalSex: spermSex,
    source: 'bioParents',
    sourceIndex: 1,
    nameKnown: Boolean(spermNameKnown),
  });

  return entries;
}

export function getParentDisplayName(
  entry: AllParentEntry,
  index: number,
): string {
  return entry.nameKnown && entry.name ? entry.name : `Parent ${index + 1}`;
}
