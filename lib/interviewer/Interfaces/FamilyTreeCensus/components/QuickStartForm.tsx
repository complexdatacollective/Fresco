'use client';

import Surface from '~/components/layout/Surface';
import Field from '~/lib/form/components/Field/Field';
import FieldGroup from '~/lib/form/components/FieldGroup';
import Form from '~/lib/form/components/Form';
import SubmitButton from '~/lib/form/components/SubmitButton';
import NumberCounterField from '~/lib/form/components/fields/NumberCounterField';
import ToggleField from '~/lib/form/components/fields/ToggleField';
import { type FieldValue } from '~/lib/form/store/types';
import { type QuickStartData } from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';

type QuickStartFormProps = {
  onSubmit: (data: QuickStartData) => void;
};

export default function QuickStartForm({ onSubmit }: QuickStartFormProps) {
  return (
    <Surface noContainer maxWidth="md">
      <Form
        onSubmit={(values) => {
          const v = values as Record<string, FieldValue>;
          onSubmit({
            parentCount: (v.parentCount as number | undefined) ?? 2,
            siblingCount: (v.siblingCount as number | undefined) ?? 0,
            hasPartner: (v.hasPartner as boolean | undefined) ?? false,
            childrenWithPartnerCount:
              (v.childrenWithPartnerCount as number | undefined) ?? 0,
            soloChildrenCount: (v.soloChildrenCount as number | undefined) ?? 0,
          });
          return { success: true };
        }}
        className="flex flex-col gap-4"
      >
        <Field
          name="parentCount"
          label="How many parents do you have?"
          component={NumberCounterField}
          initialValue={2}
          minValue={0}
          maxValue={20}
        />
        <Field
          name="siblingCount"
          label="How many siblings do you have?"
          component={NumberCounterField}
          initialValue={0}
          minValue={0}
          maxValue={20}
        />
        <Field
          name="hasPartner"
          label="Do you have a partner?"
          component={ToggleField}
          initialValue={false}
        />
        <FieldGroup
          watch={['hasPartner'] as const}
          condition={(values) => values.hasPartner === true}
        >
          <Field
            name="childrenWithPartnerCount"
            label="How many children do you have with your partner?"
            hint="You can add children from other relationships in the next section."
            component={NumberCounterField}
            initialValue={0}
            minValue={0}
            maxValue={20}
          />
        </FieldGroup>
        <Field
          name="soloChildrenCount"
          label="How many children do you have from other relationships (not with your current partner)?"
          component={NumberCounterField}
          initialValue={0}
          minValue={0}
          maxValue={20}
        />
        <SubmitButton>Get started</SubmitButton>
      </Form>
    </Surface>
  );
}
