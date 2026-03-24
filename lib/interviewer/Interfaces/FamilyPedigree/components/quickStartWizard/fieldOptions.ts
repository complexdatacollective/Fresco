import { type ParentEdgeType } from '~/lib/pedigree-layout/types';

export const PARENT_EDGE_TYPE_OPTIONS: {
  value: ParentEdgeType;
  label: string;
}[] = [
  { value: 'biological', label: 'Biological Parent' },
  { value: 'social', label: 'Social Parent (adoptive, step, foster)' },
  { value: 'donor', label: 'Sperm/Egg Donor' },
  { value: 'surrogate', label: 'Surrogate Carrier' },
];
