'use client';

import UnconnectedField from '~/lib/form/components/Field/UnconnectedField';
import InputField from '~/lib/form/components/fields/InputField';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';
import { type Gender, type Sex } from '~/lib/pedigree-layout/types';
import { GENDER_OPTIONS, SEX_OPTIONS, isGender, isSex } from './fieldOptions';

type PersonFieldsProps = {
  index: number;
  prefix: string;
  name: string;
  sex: Sex | undefined;
  gender: Gender | undefined;
  onNameChange: (value: string) => void;
  onSexChange: (value: Sex) => void;
  onGenderChange: (value: Gender) => void;
  showName?: boolean;
};

export default function PersonFields({
  index,
  prefix,
  name,
  sex,
  gender,
  onNameChange,
  onSexChange,
  onGenderChange,
  showName = true,
}: PersonFieldsProps) {
  return (
    <div className="flex flex-col gap-3">
      {showName && (
        <UnconnectedField
          name={`${prefix}-${index}-name`}
          label="Name"
          component={InputField}
          placeholder="Enter name"
          value={name}
          onChange={(v) => onNameChange(v ?? '')}
        />
      )}
      <UnconnectedField
        name={`${prefix}-${index}-sex`}
        label="Sex"
        component={RadioGroupField}
        options={SEX_OPTIONS}
        orientation="horizontal"
        value={sex ?? ''}
        onChange={(v) => {
          if (typeof v === 'string' && isSex(v)) {
            onSexChange(v);
          }
        }}
      />
      <UnconnectedField
        name={`${prefix}-${index}-gender`}
        label="Gender"
        component={RadioGroupField}
        options={GENDER_OPTIONS}
        value={gender ?? ''}
        onChange={(v) => {
          if (typeof v === 'string' && isGender(v)) {
            onGenderChange(v);
          }
        }}
      />
    </div>
  );
}
