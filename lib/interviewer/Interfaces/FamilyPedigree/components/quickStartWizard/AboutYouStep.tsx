'use client';

import Field from '~/lib/form/components/Field/Field';
import FieldGroup from '~/lib/form/components/FieldGroup';
import BooleanField from '~/lib/form/components/fields/Boolean';
import InputField from '~/lib/form/components/fields/InputField';

export default function AboutYouStep() {
  return (
    <>
      <Field
        name="siblingCount"
        inline
        label="How many siblings do you have?"
        component={InputField}
        type="number"
        min={0}
        max={20}
        initialValue="0"
      />
      <Field
        name="hasPartner"
        label="Do you have a partner?"
        hint="This includes anyone you are currently in a romantic relationship with, including dating, committed, married, etc."
        component={BooleanField}
        required
      />
      <FieldGroup
        watch={['hasPartner']}
        condition={(values) => values.hasPartner === true}
      >
        <Field
          inline
          name="noChildrenWithPartner"
          label="How many children do you have with this partner?"
          component={InputField}
          type="number"
          min={0}
          max={20}
          initialValue="0"
          required
        />
      </FieldGroup>
      <Field
        inline
        name="noChildrenWithOther"
        label="How many children do you have with other partners (not including the partner mentioned above)?"
        component={InputField}
        type="number"
        min={0}
        max={20}
        initialValue="0"
        required
      />
    </>
  );
}
