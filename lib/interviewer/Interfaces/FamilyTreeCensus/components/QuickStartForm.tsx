'use client';

import Surface from '~/components/layout/Surface';
import { Button } from '~/components/ui/Button';
import ProgressBar from '~/components/ui/ProgressBar';
import useDialog from '~/lib/dialogs/useDialog';
import BioParentsStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/BioParentsStep';
import ChildrenWithPartnerDetailStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/ChildrenWithPartnerDetailStep';
import OtherChildrenCountStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/OtherChildrenCountStep';
import OtherChildrenDetailStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/OtherChildrenDetailStep';
import ParentsCountStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/ParentsCountStep';
import ParentsDetailStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/ParentsDetailStep';
import PartnerStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/PartnerStep';
import SiblingsDetailStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/SiblingsDetailStep';
import {
  type BioParentDetail,
  type ParentDetail,
  type PersonDetail,
  type QuickStartData,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/store';
import { type Gender, type Sex } from '~/lib/pedigree-layout/types';

type QuickStartFormProps = {
  onSubmit: (data: QuickStartData) => void;
};

export default function QuickStartForm({ onSubmit }: QuickStartFormProps) {
  const { openDialog } = useDialog();

  const handleClick = async () => {
    const result = await openDialog({
      type: 'wizard',
      title: 'Build your family tree',
      progress: ({ currentStep, totalSteps }) => (
        <ProgressBar
          orientation="horizontal"
          percentProgress={((currentStep + 1) / totalSteps) * 100}
          nudge={false}
          label="Wizard progress"
        />
      ),
      steps: [
        {
          title: 'Your family',
          content: ParentsCountStep,
        },
        {
          title: 'Parent details',
          description:
            'Please provide us with further details about each parent that you mentioned.',
          content: ParentsDetailStep,
          skip: (d) => (d.parentCount as number | undefined) === 0,
        },
        {
          title: 'Biological parents',
          description: 'For the purposes of this task, we need to ask you about your biological parents specifically.',
          content: BioParentsStep,
          skip: (d) => {
            const parents = (d.parents as ParentDetail[] | undefined) ?? [];
            return parents.filter((p) => p.biological !== false).length >= 2;
          },
        },
        {
          title: 'Sibling details',
          description: 'Please now tell us about your siblings.',
          content: SiblingsDetailStep,
          skip: (d) => (d.siblingCount as number | undefined) === 0,
        },
        {
          title: 'Partner details',
          description: 'Next, tell us about your current partner.',
          content: PartnerStep,
          skip: (d) => !(d.hasPartner as boolean | undefined),
        },
        {
          title: 'Children with partner details',
          description: 'Please tell us about each of your children with your current partner.',
          content: ChildrenWithPartnerDetailStep,
          skip: (d) =>
            !(d.hasPartner as boolean | undefined) ||
            (d.childrenWithPartnerCount as number | undefined) === 0,
        },
        {
          title: 'Other children',
          content: OtherChildrenCountStep,
        },
        {
          title: 'Other children details',
          description: 'Please tell us about each of your other children from prior relationships.',
          content: OtherChildrenDetailStep,
          skip: (d) => (d.otherChildrenCount as number | undefined) === 0,
          nextLabel: 'Get started',
        },
      ],
      onFinish: (data: Record<string, unknown>) => {
        // Type assertions are acceptable here since we control the wizard
        // steps and know the exact shape of data they produce
        const quickStartData: QuickStartData = {
          parents: (data.parents as ParentDetail[] | undefined) ?? [],
          bioParents: (data.bioParents as BioParentDetail[] | undefined) ?? [],
          siblings: (data.siblings as PersonDetail[] | undefined) ?? [],
          partner: (data.hasPartner as boolean | undefined)
            ? {
                hasPartner: true,
                name:
                  typeof data.partnerName === 'string' ? data.partnerName : '',
                sex: data.partnerSex as Sex | undefined,
                gender: data.partnerGender as Gender | undefined,
              }
            : { hasPartner: false },
          childrenWithPartner:
            (data.childrenWithPartner as PersonDetail[] | undefined) ?? [],
          otherChildren:
            (data.otherChildren as PersonDetail[] | undefined) ?? [],
        };
        return quickStartData;
      },
    });

    if (result) {
      onSubmit(result as QuickStartData);
    }
  };

  return (
    <Surface noContainer maxWidth="md">
      <Button color="primary" onClick={() => void handleClick()}>
        Get started
      </Button>
    </Surface>
  );
}
