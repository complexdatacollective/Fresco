'use client';

import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { useFormValue } from '~/lib/form/hooks/useFormValue';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';

export default function ChildrenWithPartnerDetailStep() {
  const { noChildrenWithPartner } = useFormValue(['noChildrenWithPartner']);
  const childCount = Number(noChildrenWithPartner ?? 0);

  return (
    <div className="flex flex-col gap-6 pt-4">
      {Array.from({ length: childCount }, (_, i) => (
        <Surface key={i} level={1} spacing="sm">
          <Heading level="h3">Child {i + 1}</Heading>
          <PersonFields
            nameToggle={false}
            namespace={`childWithPartner[${i}]`}
          />
        </Surface>
      ))}
    </div>
  );
}
