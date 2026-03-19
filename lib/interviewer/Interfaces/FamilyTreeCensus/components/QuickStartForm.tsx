'use client';

import Surface from '~/components/layout/Surface';
import { Button } from '~/components/ui/Button';
import useDialog from '~/lib/dialogs/useDialog';
import FamilyTreePlaceholder from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/FamilyTreePlaceholder';
import BioParentsStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/BioParentsStep';
import ChildrenWithPartnerDetailStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/ChildrenWithPartnerDetailStep';
import OtherChildrenCountStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/OtherChildrenCountStep';
import OtherChildrenDetailStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/OtherChildrenDetailStep';
import ParentsCountStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/ParentsCountStep';
import ParentsDetailStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/ParentsDetailStep';
import PartnerStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/PartnerStep';
import ParentGroupingStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/ParentGroupingStep';
import SiblingParentMappingStep from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/quickStartWizard/SiblingParentMappingStep';
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
      progress: null,
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
          content: BioParentsStep,
          skip: (d) => {
            const parents = (d.parents as ParentDetail[] | undefined) ?? [];
            return parents.filter((p) => p.biologicallyRelated).length >= 2;
          },
        },
        {
          title: 'Sibling details',
          description: 'Please now tell us about your siblings.',
          content: SiblingsDetailStep,
          skip: (d) => (d.siblingCount as number | undefined) === 0,
        },
        {
          title: 'Sibling parent assignment',
          description:
            'Tell us which of your parents are also parents of each sibling.',
          content: SiblingParentMappingStep,
          skip: (d) => (d.siblingCount as number | undefined) === 0,
        },
        {
          title: 'Parent grouping',
          description: 'Tell us which of your parents raised you together.',
          content: ParentGroupingStep,
          skip: (d) => {
            const siblingCount = (d.siblingCount as number | undefined) ?? 0;
            if (siblingCount > 0) return true;
            const parents = (d.parents as ParentDetail[] | undefined) ?? [];
            const socialCount = parents.filter((p) => p.raisedYou).length;
            return socialCount < 2;
          },
        },
        {
          title: 'Partner details',
          description: 'Next, tell us about your current partner.',
          content: PartnerStep,
          skip: (d) => !(d.hasPartner as boolean | undefined),
        },
        {
          title: 'Children with partner details',
          description:
            'Please tell us about each of your children with your current partner.',
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
          description:
            'Please tell us about each of your other children from prior relationships.',
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
          siblingParentMap: data.siblingParentMap as
            | Record<number, number[]>
            | undefined,
          parentGroup: data.parentGroup as number[] | undefined,
          partner: (data.hasPartner as boolean | undefined)
            ? {
                hasPartner: true,
                name:
                  typeof data.partnerName === 'string' ? data.partnerName : '',
                sex: data.partnerSex as Sex | undefined,
                gender: data.partnerGender as Gender[] | undefined,
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
    <Surface noContainer className="flex flex-col items-center gap-6">
      <FamilyTreePlaceholder className="phone:w-112 w-full opacity-50" />
      <Button color="primary" onClick={() => void handleClick()}>
        Get started
      </Button>
    </Surface>
  );
}
