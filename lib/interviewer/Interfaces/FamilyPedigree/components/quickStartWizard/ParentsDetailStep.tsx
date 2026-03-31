'use client';

import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import Field from '~/lib/form/components/Field/Field';
import RichSelectGroupField from '~/lib/form/components/fields/RichSelectGroup';
import { useFormValue } from '~/lib/form/hooks/useFormValue';
import { PARENT_EDGE_TYPE_OPTIONS } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/fieldOptions';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';

export default function ParentsDetailStep() {
  const { parentCount: rawParentCount } = useFormValue(['parentCount']);
  const parentCount = Number(rawParentCount ?? 0);

  return (
    <div className="mt-6 flex flex-col gap-6">
      {Array.from({ length: parentCount }, (_, i) => {
        return (
          <Surface key={i} level={1} spacing="sm">
            <Heading level="h3">Parent {i + 1}</Heading>
            <PersonFields namespace={`parent-${i}`} />
            <Field
              name={`parent-${i}-edgeType`}
              label="Relationship type"
              component={RichSelectGroupField}
              options={PARENT_EDGE_TYPE_OPTIONS}
              initialValue="biological"
              required
            />
          </Surface>
        );
      })}
    </div>
  );
}
