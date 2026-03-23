import { type NodeShape } from '~/components/Node';
import {
  type Gender,
  type ParentEdgeType,
  type Sex,
} from '~/lib/pedigree-layout/types';

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'intersex', label: 'Intersex / Differences of sex development' },
  { value: 'unknown', label: 'Unknown' },
];

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'man', label: 'Man' },
  { value: 'woman', label: 'Woman' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'transgender-man', label: 'Transgender man' },
  { value: 'transgender-woman', label: 'Transgender woman' },
  { value: 'genderqueer', label: 'Genderqueer' },
  { value: 'agender', label: 'Agender' },
  { value: 'two-spirit', label: 'Two-spirit' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' },
];

export const SHAPE_OPTIONS: { value: NodeShape; label: string }[] = [
  { value: 'square', label: 'Square' },
  { value: 'circle', label: 'Circle' },
  { value: 'diamond', label: 'Diamond' },
];

export const PARENT_EDGE_TYPE_OPTIONS: {
  value: ParentEdgeType;
  label: string;
}[] = [
  { value: 'biological', label: 'Biological Parent' },
  { value: 'social', label: 'Social Parent (adoptive, step, foster)' },
  { value: 'donor', label: 'Sperm/Egg Donor' },
  { value: 'surrogate', label: 'Surrogate Carrier' },
];

export function isSex(value: string): value is Sex {
  return SEX_OPTIONS.some((o) => o.value === value);
}

export function isGender(value: string): value is Gender {
  return GENDER_OPTIONS.some((o) => o.value === value);
}

export function isNodeShape(value: string): value is NodeShape {
  return SHAPE_OPTIONS.some((o) => o.value === value);
}
