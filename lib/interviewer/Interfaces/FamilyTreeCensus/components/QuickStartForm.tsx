'use client';

import Surface from '~/components/layout/Surface';
import { Button } from '~/components/ui/Button';
import useDialog from '~/lib/dialogs/useDialog';
import BioParentsStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/BioParentsStep';
import ChildrenWithPartnerCountStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/ChildrenWithPartnerCountStep';
import ChildrenWithPartnerDetailStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/ChildrenWithPartnerDetailStep';
import OtherChildrenCountStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/OtherChildrenCountStep';
import OtherChildrenDetailStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/OtherChildrenDetailStep';
import ParentsCountStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/ParentsCountStep';
import ParentsDetailStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/ParentsDetailStep';
import PartnerStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/PartnerStep';
import SiblingsCountStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/SiblingsCountStep';
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
      steps: [
        {
          title: 'Parents',
          content: ParentsCountStep,
        },
        {
          title: 'Parent details',
          description:
            'Please provide us with further details about each parent that you mentioned.',
          content: ParentsDetailStep,
        },
        {
          title: 'Biological parents',
          description: 'Information about biological parents for the pedigree.',
          content: BioParentsStep,
        },
        {
          title: 'Siblings',
          description: 'How many siblings do you have?',
          content: SiblingsCountStep,
        },
        {
          title: 'Sibling details',
          description: 'Tell us about each sibling.',
          content: SiblingsDetailStep,
        },
        {
          title: 'Partner',
          description: 'Do you have a partner?',
          content: PartnerStep,
        },
        {
          title: 'Children with partner',
          description: 'How many children do you have with your partner?',
          content: ChildrenWithPartnerCountStep,
        },
        {
          title: 'Children with partner details',
          description: 'Tell us about each child.',
          content: ChildrenWithPartnerDetailStep,
        },
        {
          title: 'Other children',
          description: 'Children from other relationships.',
          content: OtherChildrenCountStep,
        },
        {
          title: 'Other children details',
          description: 'Tell us about each child.',
          content: OtherChildrenDetailStep,
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
