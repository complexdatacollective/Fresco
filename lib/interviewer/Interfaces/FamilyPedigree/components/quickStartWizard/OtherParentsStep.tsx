'use client';

import Field from '~/components/ui/form/components/Field/Field';
import FieldGroup from '~/components/ui/form/components/FieldGroup';
import BooleanField from '~/components/ui/form/components/fields/Boolean';
import InputField from '~/components/ui/form/components/fields/InputField';

export default function OtherParentsStep() {
  return (
    <>
      <Field
        label="Do you have any additional parents?"
        hint="This includes adoptive parents, stepparents, or any other parents who are not your biological parents."
        name="hasOtherParents"
        component={BooleanField}
        required
      />
      <FieldGroup
        watch={['hasOtherParents']}
        condition={(values) => values.hasOtherParents === true}
      >
        <Field
          label="How many additional parents do you have?"
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
