'use client';

import Field from '~/lib/form/components/Field/Field';
import FieldGroup from '~/lib/form/components/FieldGroup';
import BooleanField from '~/lib/form/components/fields/Boolean';
import InputField from '~/lib/form/components/fields/InputField';

export default function GenericOtherParentsStep() {
  return (
    <>
      <Field
        label="Did this person have any additional parents?"
        hint="This includes adoptive parents, stepparents, or any other parents who are not biological parents."
        name="hasOtherParents"
        component={BooleanField}
        required
      />
      <FieldGroup
        watch={['hasOtherParents']}
        condition={(values) => values.hasOtherParents === true}
      >
        <Field
          label="How many additional parents did they have?"
          name="otherParentCount"
          component={InputField}
          type="number"
          min={1}
          initialValue="1"
          autoFocus
          required
        />
      </FieldGroup>
    </>
  );
}
