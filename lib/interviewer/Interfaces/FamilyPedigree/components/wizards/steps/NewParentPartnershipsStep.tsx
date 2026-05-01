'use client';

import { useContext, useMemo } from 'react';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';
import Field from '@codaco/fresco-ui/form/Field/Field';
import RadioGroupField from '@codaco/fresco-ui/form/fields/RadioGroup';
import { useFormValue } from '@codaco/fresco-ui/form/hooks/useFormValue';
import { BioTriadConfigContext } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/steps/BioTriadStep';

const partnershipOptions = [
  { value: 'current', label: 'Current partners' },
  { value: 'ex', label: 'Ex-partners' },
  { value: 'none', label: 'Never partners' },
];

const WATCHED_FIELDS = [
  'egg-source',
  'sperm-source',
  'carrier-source',
  'new-egg-source.name',
  'new-egg-source.sex-at-birth',
  'new-sperm-source.name',
  'new-sperm-source.sex-at-birth',
  'new-carrier.name',
  'new-carrier.sex-at-birth',
] as const;

type ParentKey = 'egg-source' | 'sperm-source' | 'carrier-source';

const ALL_PARENT_KEYS: ParentKey[] = [
  'egg-source',
  'sperm-source',
  'carrier-source',
];

type ParentEntry = {
  key: ParentKey;
  label: string;
  isNew: boolean;
};

function getNewParentLabel(
  key: ParentKey,
  values: Record<string, unknown>,
): string {
  const nameMap: Record<ParentKey, string> = {
    'egg-source': 'new-egg-source.name',
    'sperm-source': 'new-sperm-source.name',
    'carrier-source': 'new-carrier.name',
  };

  const sexMap: Record<ParentKey, string> = {
    'egg-source': 'new-egg-source.sex-at-birth',
    'sperm-source': 'new-sperm-source.sex-at-birth',
    'carrier-source': 'new-carrier.sex-at-birth',
  };

  const fallbackMap: Record<ParentKey, string> = {
    'egg-source': 'New egg parent',
    'sperm-source': 'New sperm parent',
    'carrier-source': 'New gestational carrier',
  };

  const name = values[nameMap[key]];
  if (typeof name === 'string' && name.length > 0) return name;

  const sex = values[sexMap[key]];
  if (typeof sex === 'string' && sex.length > 0) {
    return `${fallbackMap[key]} (assigned ${sex} at birth)`;
  }

  return fallbackMap[key];
}

export function shouldSkipNewParentPartnerships({
  getFieldValue,
}: {
  getFieldValue: (name: string) => unknown;
}) {
  const newCount = ALL_PARENT_KEYS.filter(
    (key) => getFieldValue(key) === 'new',
  ).length;
  const totalParents = ALL_PARENT_KEYS.filter((key) => {
    const val = getFieldValue(key);
    return val !== undefined && val !== 'egg-source';
  }).length;
  return newCount === 0 || totalParents < 2;
}

export default function NewParentPartnershipsStep() {
  const formValues = useFormValue(WATCHED_FIELDS);
  const { existingNodes } = useContext(BioTriadConfigContext);
  const nodeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const node of existingNodes ?? []) {
      map.set(node.value, node.label);
    }
    return map;
  }, [existingNodes]);

  const parents = useMemo<ParentEntry[]>(() => {
    const list: ParentEntry[] = [];

    for (const key of ALL_PARENT_KEYS) {
      const selection = formValues[key] as string | undefined;
      if (!selection || selection === 'egg-source') continue;

      if (selection === 'new') {
        list.push({
          key,
          label: getNewParentLabel(key, formValues),
          isNew: true,
        });
      } else if (selection === 'unknown') {
        const fallbackMap: Record<ParentKey, string> = {
          'egg-source': 'Unknown egg parent',
          'sperm-source': 'Unknown sperm parent',
          'carrier-source': 'Unknown gestational carrier',
        };
        list.push({ key, label: fallbackMap[key], isNew: false });
      } else {
        const label = nodeMap.get(selection) ?? 'Unknown person';
        list.push({ key, label, isNew: false });
      }
    }

    return list;
  }, [formValues, nodeMap]);

  const pairs = useMemo(() => {
    const result: [ParentEntry, ParentEntry][] = [];
    for (let i = 0; i < parents.length; i++) {
      for (let j = i + 1; j < parents.length; j++) {
        const a = parents[i]!;
        const b = parents[j]!;
        if (a.isNew || b.isNew) {
          result.push([a, b]);
        }
      }
    }
    return result;
  }, [parents]);

  if (pairs.length === 0) return null;

  return (
    <>
      <div className="mb-8">
        <Paragraph>
          We now want to ask about relationships between the parents you named.
          This includes current and past romantic partnerships, but{' '}
          <strong>not co-parenting partnerships</strong> where the parents were
          never romantically involved.
        </Paragraph>
      </div>
      <div className="flex flex-col gap-6">
        {pairs.map(([a, b]) => (
          <Field
            key={`partnership-${a.key}-${b.key}`}
            name={`partnership-${a.key}-${b.key}`}
            label={`Are ${a.label} and ${b.label} partners?`}
            component={RadioGroupField}
            options={partnershipOptions}
            required
          />
        ))}
      </div>
    </>
  );
}
