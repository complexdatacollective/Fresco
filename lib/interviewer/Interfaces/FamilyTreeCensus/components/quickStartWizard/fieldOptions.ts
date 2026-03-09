import {
  type Gender,
  type ParentEdgeType,
  type Sex,
} from '~/lib/pedigree-layout/types';

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
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

export const PARENT_EDGE_TYPE_OPTIONS: {
  value: ParentEdgeType;
  label: string;
}[] = [
  { value: 'bio-parent', label: 'Biological parent' },
  { value: 'social-parent', label: 'Social parent' },
  { value: 'donor', label: 'Donor' },
  { value: 'surrogate', label: 'Surrogate' },
  { value: 'co-parent', label: 'Co-parent' },
];

export function isSex(value: string): value is Sex {
  return SEX_OPTIONS.some((o) => o.value === value);
}

export function isGender(value: string): value is Gender {
  return GENDER_OPTIONS.some((o) => o.value === value);
}

export function isParentEdgeType(value: string): value is ParentEdgeType {
  return PARENT_EDGE_TYPE_OPTIONS.some((o) => o.value === value);
}
