import { type RichSelectOption } from '~/lib/form/components/fields/RichSelectGroup';

export const PARENT_EDGE_TYPE_OPTIONS: (RichSelectOption & {
  value: string;
})[] = [
  {
    value: 'biological',
    label: 'Biological Parent',
    description: 'A parent who is genetically related to you',
  },
  {
    value: 'social',
    label: 'Social Parent',
    description: 'An adoptive, step, or foster parent',
  },
  {
    value: 'donor',
    label: 'Donor',
    description: 'Someone who donated sperm or an egg for your conception',
  },
  {
    value: 'surrogate',
    label: 'Surrogate',
    description: 'Someone who carried you during pregnancy',
  },
];

export function isBiologicalEdgeType(edgeType: string): boolean {
  return edgeType === 'biological' || edgeType === 'donor';
}
