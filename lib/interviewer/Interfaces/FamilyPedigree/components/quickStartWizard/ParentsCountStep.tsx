'use client';

import Field from '~/lib/form/components/Field/Field';
import BooleanField from '~/lib/form/components/fields/Boolean';
import InputField from '~/lib/form/components/fields/InputField';

export default function ParentsCountStep() {
  return (
    <>
      <Field
        name="parentCount"
        inline
        label="How many parents do you have?"
        hint="This includes donors/surrogates, step, adoptive, and anyone else that you identify as a parent."
        component={InputField}
        type="number"
        initialValue="2"
        min={0}
        max={20}
      />
      <Field
        name="siblingCount"
        inline
        label="How many siblings do you have?"
        component={InputField}
        type="number"
        initialValue="0"
        min={0}
        max={20}
      />
      <Field
        name="hasPartner"
        inline
        label="Do you have a partner?"
        hint="This includes anyone you are currently in a romantic relationship with, including dating, committed, married, etc."
        component={BooleanField}
        required
      />
    </>
  );
}
