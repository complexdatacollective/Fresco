'use client';

import Field from '~/components/ui/form/components/Field/Field';
import FieldGroup from '~/components/ui/form/components/FieldGroup';
import BooleanField from '~/components/ui/form/components/fields/Boolean';
import InputField from '~/components/ui/form/components/fields/InputField';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';

export default function PartnerAndChildrenStep() {
  return (
    <>
      <Field
        label="Do you have a current partner?"
        name="hasPartner"
        component={BooleanField}
        required
      />
      <FieldGroup
        watch={['hasPartner']}
        condition={(values) => values.hasPartner === true}
      >
        <PersonFields namespace="partner" />
        <Field
          label="How many children do you have with this partner?"
          name="childrenWithPartnerCount"
          component={InputField}
          type="number"
          min={0}
          initialValue="0"
          required
        />
      </FieldGroup>
    </>
  );
}
