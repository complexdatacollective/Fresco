import { type RichSelectOption } from '@codaco/fresco-ui/form/fields/RichSelectGroup';

export const PARENT_EDGE_TYPE_OPTIONS_ALTER: (RichSelectOption & {
  value: string;
})[] = [
  {
    value: 'biological',
    label: 'Biological Parent',
    description: 'A parent who is genetically related to this person',
  },
  {
    value: 'social',
    label: 'Social Parent',
    description: 'An adoptive, step, or foster parent',
  },
  {
    value: 'donor',
    label: 'Donor',
    description:
      "Someone who donated sperm or an egg for this person's conception",
  },
  {
    value: 'surrogate',
    label: 'Surrogate',
    description: 'Someone who carried this person during pregnancy',
  },
];
