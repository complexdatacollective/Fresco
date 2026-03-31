'use client';

import Field from '~/lib/form/components/Field/Field';
import InputField from '~/lib/form/components/fields/InputField';

export default function OtherChildrenCountStep() {
  return (
    <Field
      name="otherChildrenCount"
      inline
      label="How many children do you have from other relationships?"
      component={InputField}
      type="number"
      initialValue="0"
      min={0}
      max={20}
    />
  );
}
