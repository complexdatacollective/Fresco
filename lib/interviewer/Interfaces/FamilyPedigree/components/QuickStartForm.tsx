'use client';

import { AnimatePresence, motion } from 'motion/react';
import Paragraph from '~/components/typography/Paragraph';
import useDialog from '~/lib/dialogs/useDialog';
import AdditionalParentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/AdditionalParentsStep';
import BioParentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/BioParentsStep';
import ChildrenWithPartnerDetailStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/ChildrenWithPartnerDetailStep';
import HalfSiblingParentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/HalfSiblingParentsStep';
import OtherChildrenDetailStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/OtherChildrenDetailStep';
import OtherParentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/OtherParentsStep';
import ParentPartnershipsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/ParentPartnershipsStep';
import PartnerStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PartnerStep';
import SiblingsDetailStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/SiblingsDetailStep';
import { transformFormValues } from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/transformFormValues';
import { type QuickStartData } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import ActionButton from '~/lib/interviewer/components/ActionButton';
import AboutYouStep from './quickStartWizard/AboutYouStep';

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
          title: 'Other parents',
          content: OtherParentsStep,
        },
        {
          title: 'Additional parents',
          content: AdditionalParentsStep,
          skip: ({ getFieldValue }) =>
            getFieldValue('hasOtherParents') !== true,
        },
        {
          title: 'Parent partnerships',
          content: ParentPartnershipsStep,
        },
        {
          title: 'About you',
          content: AboutYouStep,
        },
        {
          title: 'Sibling details',
          content: SiblingsDetailStep,
          skip: ({ getFieldValue }) => {
            const siblingCount = Number(getFieldValue('siblingCount') ?? 0);

            console.log('Sibling count:', siblingCount);

            return Number(getFieldValue('siblingCount') ?? 0) === 0;
          },
        },
        {
          title: "Half-siblings' other parents",
          description: 'Tell us about the other parent of your half-siblings.',
          content: HalfSiblingParentsStep,
          skip: ({ getFieldValue }) => {
            const siblingCount = Number(getFieldValue('siblingCount') ?? 0);
            if (siblingCount === 0) return true;
            const parentCount = Number(getFieldValue('parentCount') ?? 0);
            const egoParentsRaw = getFieldValue('ego-parents');
            const egoSet = new Set(
              Array.isArray(egoParentsRaw)
                ? egoParentsRaw.map(String)
                : Array.from({ length: parentCount }, (_, i) => String(i)),
            );

            for (let i = 0; i < siblingCount; i++) {
              const sharedRaw = getFieldValue(`sibling-${i}-sharedParents`);
              const shared: string[] = Array.isArray(sharedRaw)
                ? sharedRaw.map(String)
                : [];
              const sharedSet = new Set(shared);
              const isStrictSubset =
                sharedSet.size < egoSet.size &&
                [...sharedSet].every((idx) => egoSet.has(idx));
              if (isStrictSubset) return false;
            }
            return true;
          },
        },
        {
          title: 'Partner details',
          description: 'Next, tell us about your current partner.',
          content: PartnerStep,
          skip: ({ getFieldValue }) => getFieldValue('hasPartner') !== true,
        },
        {
          title: 'Children with partner details',
          description:
            'Please tell us about each of your children with your current partner.',
          content: ChildrenWithPartnerDetailStep,
          skip: ({ getFieldValue }) =>
            getFieldValue('hasPartner') !== true ||
            Number(getFieldValue('noChildrenWithPartner') ?? 0) === 0,
        },
        {
          title: 'Other children details',
          description:
            'Please tell us about each of your other children from prior relationships.',
          content: OtherChildrenDetailStep,
          skip: ({ getFieldValue }) =>
            Number(getFieldValue('noChildrenWithOther') ?? 0) === 0,
        },
      ],
      onFinish: (formValues: Record<string, unknown>) => {
        console.log('Form values:', formValues);
        return transformFormValues(formValues);
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
          onClick={handleClick}
        />
      </motion.div>
    </AnimatePresence>
  );
}
