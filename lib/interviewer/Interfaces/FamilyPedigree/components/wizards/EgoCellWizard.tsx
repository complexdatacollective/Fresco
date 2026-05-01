'use client';

import { AnimatePresence, motion } from 'motion/react';
import useDialog from '@codaco/fresco-ui/dialogs/useDialog';
import AdditionalParentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/AdditionalParentsStep';
import BioParentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/BioParentsStep';
import ChildrenDetailStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/ChildrenDetailStep';
import OtherParentsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/OtherParentsStep';
import ParentPartnershipsStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/ParentPartnershipsStep';
import PartnerAndChildrenStep from '~/lib/interviewer/Interfaces/FamilyPedigree/components/quickStartWizard/PartnerAndChildrenStep';
import {
  egoCellTransform,
  type EgoCellResult,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/transforms/egoCellTransform';
import { type VariableConfig } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import ActionButton from '~/lib/interviewer/components/ActionButton';

type EgoCellWizardProps = {
  egoId?: string;
  onSubmit: (result: EgoCellResult) => void;
  variableConfig: VariableConfig;
};

export default function EgoCellWizard({
  egoId,
  onSubmit,
  variableConfig,
}: EgoCellWizardProps) {
  const { openDialog } = useDialog();

  const handleClick = async () => {
    const result = await openDialog({
      type: 'wizard',
      title: 'Your Biological Parents',
      className: 'tablet-portrait:min-w-[70ch]',
      progress: null,
      steps: [
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
          title: 'Partner and children',
          content: PartnerAndChildrenStep,
        },
        {
          title: 'Children details',
          content: ChildrenDetailStep,
          skip: ({ getFieldValue }) => {
            if (getFieldValue('hasPartner') !== true) return true;
            return Number(getFieldValue('childrenWithPartnerCount') ?? 0) === 0;
          },
        },
      ],
      onFinish: (formValues: Record<string, unknown>) => {
        return egoCellTransform(formValues, variableConfig, egoId);
      },
    });

    if (result && typeof result === 'object' && 'batch' in result) {
      onSubmit(result as EgoCellResult);
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
          aria-label="Build family pedigree"
          iconName="Network"
          onClick={handleClick}
        />
      </motion.div>
    </AnimatePresence>
  );
}
