import RadioGroup from '~/lib/form/components/fields/RadioGroup';
import { type FamilyTreeNodeType } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/components/FamilyTreeNode';
import type { FieldConfig } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/useDynamicFields';
import type { RelativeOption } from '~/lib/interviewer/containers/Interfaces/FamilyTreeCensus/useRelatives';

export function getRelationFlags(nodes: FamilyTreeNodeType[]) {
  const hasAuntOrUncle = nodes.some((n) => /\b(aunt|uncle)\b/i.test(n.label));
  const hasSiblings = nodes.some((n) =>
    ['brother', 'sister', 'halfBrother', 'halfSister'].includes(n.label),
  );
  const hasChildren = nodes.some((n) => ['son', 'daughter'].includes(n.label));

  return { hasAuntOrUncle, hasSiblings, hasChildren };
}

export function buildBaseOptions(flags: ReturnType<typeof getRelationFlags>) {
  const opts = [
    { label: 'Aunt', value: 'aunt' },
    { label: 'Uncle', value: 'uncle' },
    { label: 'Daughter', value: 'daughter' },
    { label: 'Son', value: 'son' },
    { label: 'Brother', value: 'brother' },
    { label: 'Sister', value: 'sister' },
    { label: 'Half Sister', value: 'halfSister' },
    { label: 'Half Brother', value: 'halfBrother' },
  ];

  if (flags.hasAuntOrUncle) {
    opts.push(
      { label: 'First Cousin (Male)', value: 'firstCousinMale' },
      { label: 'First Cousin (Female)', value: 'firstCousinFemale' },
    );
  }

  if (flags.hasSiblings) {
    opts.push(
      { label: 'Niece', value: 'niece' },
      { label: 'Nephew', value: 'nephew' },
    );
  }

  if (flags.hasChildren) {
    opts.push(
      { label: 'Granddaughter', value: 'granddaughter' },
      { label: 'Grandson', value: 'grandson' },
    );
  }

  return opts;
}

export type RadioGroupConfig = FieldConfig<
  React.ComponentProps<typeof RadioGroup>
>;

export function createRelationField(
  label: string,
  variable: string,
  options: RelativeOption[],
): RadioGroupConfig {
  return {
    fieldLabel: label,
    options,
    type: 'ordinal',
    variable,
    Component: RadioGroup,
    validation: {
      onSubmit: (value: { value: string }) =>
        value?.value ? undefined : 'Relation is required',
      onChange: () => undefined,
    },
  };
}
