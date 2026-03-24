'use client';

import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import useDialog from '~/lib/dialogs/useDialog';
import FamilyPedigreePlaceholder from '~/lib/pedigree-layout/components/FamilyPedigreePlaceholder';
import AdoptionStatusStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/AdoptionStatusStep';
import BioParentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/BioParentsStep';
import ChildrenWithPartnerDetailStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/ChildrenWithPartnerDetailStep';
import GestationalCarrierStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/GestationalCarrierStep';
import OtherChildrenCountStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/OtherChildrenCountStep';
import OtherChildrenDetailStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/OtherChildrenDetailStep';
import ParentPartnershipsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/ParentPartnershipsStep';
import ParentsCountStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/ParentsCountStep';
import ParentsDetailStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/ParentsDetailStep';
import PartnerStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PartnerStep';
import SiblingsDetailStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/SiblingsDetailStep';
import {
  type AdoptionStatus,
  type BioParentDetail,
  type ParentDetail,
  type ParentPartnership,
  type PersonDetail,
  type QuickStartData,
  type SiblingDetail,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';

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
          title: 'Adoption status',
          content: AdoptionStatusStep,
        },
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
          title: 'Parent partnerships',
          content: ParentPartnershipsStep,
          skip: (d) => ((d.parentCount as number | undefined) ?? 0) < 2,
        },
        {
          title: 'Biological parents',
          content: BioParentsStep,
          skip: (d) => {
            const parents = (d.parents as ParentDetail[] | undefined) ?? [];
            return parents.filter((p) => p.biological !== false).length >= 2;
          },
        },
        {
          title: 'Gestational carrier',
          content: GestationalCarrierStep,
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
        const rawAdoption = data.adoptionStatus;
        const adoptionStatus: AdoptionStatus | undefined =
          rawAdoption === 'in' ||
          rawAdoption === 'out' ||
          rawAdoption === 'by-relative'
            ? rawAdoption
            : undefined;

        const quickStartData: QuickStartData = {
          adoptionStatus,
          parents: (data.parents as ParentDetail[] | undefined) ?? [],
          parentPartnerships:
            (data.parentPartnerships as ParentPartnership[] | undefined) ?? [],
          gestationalCarrierParentIndex: data.gestationalCarrierParentIndex as
            | number
            | undefined,
          bioParents: (data.bioParents as BioParentDetail[] | undefined) ?? [],
          siblings: (data.siblings as SiblingDetail[] | undefined) ?? [],
          partner: (data.hasPartner as boolean | undefined)
            ? {
                hasPartner: true,
                name:
                  typeof data.partnerName === 'string' ? data.partnerName : '',
                biologicalSex: data.partnerSex as string | undefined,
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
    <div className="flex flex-col items-center gap-6">
      <FamilyPedigreePlaceholder className="w-96 max-w-full opacity-25" />
      <Paragraph emphasis="muted" margin="none" className="text-center">
        Your family tree will appear here
      </Paragraph>
      <Button color="primary" onClick={() => void handleClick()}>
        Get started
      </Button>
    </div>
  );
}
