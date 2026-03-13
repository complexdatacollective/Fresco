'use client';

import Field from '~/lib/form/components/Field/Field';
import CheckboxGroupField from '~/lib/form/components/fields/CheckboxGroup';
import InputField from '~/lib/form/components/fields/InputField';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import { type CustomFieldValidation } from '~/lib/form/store/types';
import {
  GENDER_OPTIONS,
  SEX_OPTIONS,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/fieldOptions';
import { type Gender, type Sex } from '~/lib/pedigree-layout/types';

type PersonFieldsProps = {
  index: number;
  prefix: string;
  initial?: { name?: string; sex?: Sex; gender?: Gender[] };
  showName?: boolean;
  sexCustomValidation?: CustomFieldValidation | CustomFieldValidation[];
};

export default function PersonFields({
  index,
  prefix,
  initial,
  showName = true,
  sexCustomValidation,
}: PersonFieldsProps) {
  return (
    <>
      {showName && (
        <Field
          name={`${prefix}-${index}-name`}
          label="Name"
          component={InputField}
          placeholder="Enter name"
          autoFocus
          initialValue={initial?.name ?? ''}
          required
        />
      )}
      <Field
        name={`${prefix}-${index}-sex`}
        label="Sex assigned at birth"
        component={RadioGroupField}
        options={SEX_OPTIONS}
        orientation="horizontal"
        initialValue={initial?.sex}
        required
        custom={sexCustomValidation}
        validateOnChange
      />
      <Field
        name={`${prefix}-${index}-gender`}
        label="Gender (select all that apply)"
        component={CheckboxGroupField}
        options={GENDER_OPTIONS}
        initialValue={initial?.gender ?? []}
        required
      />
    </>
  );
}
