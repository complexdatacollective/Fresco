'use client';

import { AnimatePresence, motion } from 'motion/react';
import Paragraph from '~/components/typography/Paragraph';
import useDialog from '~/lib/dialogs/useDialog';
import BioParentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/BioParentsStep';
import ChildrenWithPartnerDetailStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/ChildrenWithPartnerDetailStep';
import HalfSiblingParentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/HalfSiblingParentsStep';
import OtherChildrenCountStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/OtherChildrenCountStep';
import OtherChildrenDetailStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/OtherChildrenDetailStep';
import ParentPartnershipsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/ParentPartnershipsStep';
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
          title: 'Creating your family pedigree',
          content: () => (
            <>
              <Paragraph>
                This wizard will guide you through a series of questions to
                quickly build a family pedigree. A pedigree is a family tree
                diagram that shows your relatives and their health information.
              </Paragraph>
            </>
          ),
        },
        {
          title: 'Your biological parents',
          content: BioParentsStep,
        },
        {
          title: 'Additional parents',
          content: () => <></>,
          skip: ({ getFieldValue }) =>
            getFieldValue('hasOtherParents') !== true,
        },
        {
          title: 'Parent partnerships',
          content: ParentPartnershipsStep,
          skip: ({ data: d }) => Number(d.parentCount ?? 0) < 2,
        },
        {
          title: 'Sibling details',
          description: 'Please now tell us about your siblings.',
          content: SiblingsDetailStep,
          skip: ({ data: d }) => Number(d.siblingCount ?? 0) === 0,
        },
        {
          title: "Half-siblings' other parents",
          description: 'Tell us about the other parent of your half-siblings.',
          content: HalfSiblingParentsStep,
          skip: ({ data: d }) => {
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
          skip: ({ data: d }) => !(d.hasPartner as boolean | undefined),
        },
        {
          title: 'Children with partner details',
          description:
            'Please tell us about each of your children with your current partner.',
          content: ChildrenWithPartnerDetailStep,
          skip: ({ data: d }) =>
            !(d.hasPartner as boolean | undefined) ||
            Number(d.childrenWithPartnerCount ?? 0) === 0,
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
          skip: ({ data: d }) =>
            (d.otherChildrenCount as number | undefined) === 0,
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
        <ActionButton
          aria-label="Build family tree"
          iconName="Network"
          onClick={() => void handleClick()}
        />
      </motion.div>
    </AnimatePresence>
  );
}
