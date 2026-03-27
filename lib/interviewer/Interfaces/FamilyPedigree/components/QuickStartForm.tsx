'use client';

import { AnimatePresence, motion } from 'motion/react';
import useDialog from '~/lib/dialogs/useDialog';
import AdoptionStatusStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/AdoptionStatusStep';
import BioParentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/BioParentsStep';
import ChildrenWithPartnerDetailStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/ChildrenWithPartnerDetailStep';
import GestationalCarrierStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/GestationalCarrierStep';
import HalfSiblingParentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/HalfSiblingParentsStep';
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
  type HalfSiblingOtherParent,
  type ParentDetail,
  type ParentPartnership,
  type PersonDetail,
  type QuickStartData,
  type SiblingDetail,
  type SiblingFamily,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import ActionButton from '~/lib/interviewer/components/ActionButton';

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
      confirmCancel: {
        title: 'Cancel wizard?',
        description:
          'All information you have entered will be lost. You will need to start the wizard again to complete this task.',
      },
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
          // Skip when exactly one biological parent was assigned female at
          // birth, since the carrier is unambiguous. When zero or multiple
          // are female (e.g. egg donor + carrier) we need to ask.
          skip: (d) => {
            const parents = (d.parents as ParentDetail[] | undefined) ?? [];
            const bioParents =
              (d.bioParents as PersonDetail[] | undefined) ?? [];

            const biologicalParents = [
              ...parents.filter((p) => p.biological !== false),
              ...bioParents,
            ];

            const femaleCount = biologicalParents.filter(
              (p) => p.biologicalSex === 'female',
            ).length;

            return femaleCount === 1;
          },
        },
        {
          title: 'Sibling details',
          description: 'Please now tell us about your siblings.',
          content: SiblingsDetailStep,
          skip: (d) => !d.siblingCount || d.siblingCount === 0,
        },
        {
          title: "Half-siblings' other parents",
          description: 'Tell us about the other parent of your half-siblings.',
          content: HalfSiblingParentsStep,
          skip: (d) => {
            const siblings = (d.siblings as SiblingDetail[] | undefined) ?? [];
            if (siblings.length === 0) return true;
            const parents = (d.parents as ParentDetail[] | undefined) ?? [];
            const egoParentIndices =
              (d.egoParentIndices as number[] | undefined) ??
              parents.map((_, i) => i);
            const egoSet = new Set(egoParentIndices);
            return siblings.every((sib) => {
              const sibSet = new Set(sib.sharedParentIndices);
              return (
                egoSet.size === sibSet.size &&
                [...egoSet].every((idx) => sibSet.has(idx))
              );
            });
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
          egoParentIndices: data.egoParentIndices as number[] | undefined,
          bioParents: (data.bioParents as BioParentDetail[] | undefined) ?? [],
          siblings: (data.siblings as SiblingDetail[] | undefined) ?? [],
          partner: (data.hasPartner as boolean | undefined)
            ? {
                hasPartner: true,
                name:
                  typeof data.partnerName === 'string' ? data.partnerName : '',
                biologicalSex: data.partnerSex as string | undefined,
                attributes:
                  (data.partnerAttributes as Record<string, unknown>) ??
                  undefined,
              }
            : { hasPartner: false },
          childrenWithPartner:
            (data.childrenWithPartner as PersonDetail[] | undefined) ?? [],
          otherChildren:
            (data.otherChildren as PersonDetail[] | undefined) ?? [],
          parentBranches: [],
          halfSiblingOtherParents:
            (data.halfSiblingOtherParents as
              | HalfSiblingOtherParent[]
              | undefined) ?? [],
          siblingFamilies:
            (data.siblingFamilies as SiblingFamily[] | undefined) ?? [],
        };
        return quickStartData;
      },
    });

    if (result) {
      onSubmit(result as QuickStartData);
    }
  };

  const variants = {
    initial: { opacity: 0, y: '100%' },
    animate: { opacity: 1, y: '0rem' },
  };

  return (
    <AnimatePresence>
      <motion.div
        key="get-started-button"
        className="absolute right-12 bottom-4 z-20"
        variants={variants}
        initial="initial"
        animate="animate"
      >
        <ActionButton iconName="Network" onClick={() => void handleClick()} />
      </motion.div>
    </AnimatePresence>
  );
}
