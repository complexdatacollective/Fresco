'use client';

import Field from '~/lib/form/components/Field/Field';
import RadioGroupField from '~/lib/form/components/fields/RadioGroup';

const adoptionOptions = [
  { value: 'none', label: 'No' },
  { value: 'in', label: 'Yes, I was adopted into my family' },
  { value: 'out', label: 'Yes, I was adopted out of my birth family' },
  { value: 'by-relative', label: 'Yes, I was adopted by a relative' },
];

export default function AdoptionStatusStep() {
  return (
    <Field
      name="adoptionStatus"
      label="Were you adopted?"
      component={RadioGroupField}
      options={adoptionOptions}
      initialValue={'none'}
      required
    />
  );
}
