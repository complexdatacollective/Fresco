'use client';

import { useSelector } from 'react-redux';
import Field from '~/lib/form/components/Field/Field';
import InputField from '~/lib/form/components/fields/InputField';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import { type CustomFieldValidation } from '~/lib/form/store/types';
import { getBiologicalSexOptions } from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';

type PersonFieldsProps = {
  index: number;
  prefix: string;
  initial?: { name?: string; sex?: string };
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
  const sexOptions = useSelector(getBiologicalSexOptions);

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
        options={sexOptions}
        initialValue={initial?.sex}
        required
        custom={sexCustomValidation}
        validateOnChange
      />
    </>
  );
}
