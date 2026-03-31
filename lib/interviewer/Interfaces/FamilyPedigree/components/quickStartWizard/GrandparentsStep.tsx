'use client';

import { useMemo } from 'react';
import Surface from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import useFormStore from '~/lib/form/hooks/useFormStore';
import {
  getAllParents,
  getParentDisplayName,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/getAllParents';
import PersonFields from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PersonFields';

export default function GrandparentsStep() {
  const getFieldState = useFormStore((s) => s.getFieldState);

  const allParents = useMemo(
    () => getAllParents((name) => getFieldState(name)?.value),
    [getFieldState],
  );

  return (
    <div className="mt-6 flex flex-col gap-6">
      {allParents.map((entry, parentIdx) => {
        const parentName = getParentDisplayName(entry, parentIdx);

        return (
          <Surface key={parentIdx} level={1} spacing="sm">
            <Heading level="h3">{parentName}&apos;s parents</Heading>
            {([0, 1] as const).map((gpIdx) => {
              return (
                <Surface key={gpIdx} level={2} spacing="sm">
                  <Heading level="h4">Grandparent {gpIdx + 1}</Heading>
                  <PersonFields
                    namespace={`grandparent-${parentIdx}-${gpIdx}`}
                  />
                </Surface>
              );
            })}
          </Surface>
        );
      })}
    </div>
  );
}
