'use client';

import Surface from '~/components/ui/layout/Surface';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';
import { useFormValue } from '~/components/ui/form/hooks/useFormValue';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';

export default function ChildrenDetailStep() {
  const { childrenWithPartnerCount } = useFormValue([
    'childrenWithPartnerCount',
  ]);
  const count = Number(childrenWithPartnerCount ?? 0);

  if (count === 0) return null;

  return (
    <>
      <Paragraph>
        Please tell us about each of your children with your current partner.
      </Paragraph>
      <div className="flex flex-col gap-6">
        {Array.from({ length: count }, (_, i) => (
          <Surface key={i} level={1} spacing="sm">
            <Heading level="h3">Child {i + 1}</Heading>
            <PersonFields
              namespace={`childWithPartner[${String(i)}]`}
            />
          </Surface>
        ))}
      </div>
    </>
  );
}
