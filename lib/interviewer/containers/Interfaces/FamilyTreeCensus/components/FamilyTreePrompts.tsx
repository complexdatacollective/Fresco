import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
import { useSelector } from 'react-redux';
import { getCurrentStage } from '~/lib/interviewer/selectors/session';
import Prompts from '~/lib/ui/components/Prompts/Prompts';
import { useFamilyTreeStore } from '../FamilyTreeProvider';

const getFamilyTreeStepText = createSelector(getCurrentStage, (stage) => {
  if (stage.type !== 'FamilyTreeCensus') return null;

  const prompts = [];

  prompts.push({
    id: '0',
    text: stage.step1.text,
  });

  prompts.push({
    id: '1',
    text: stage.step2.text,
  });

  if (stage.step3) {
    prompts.push({
      id: '2',
      text: stage.step3.text,
    });
  }

  return prompts;
});

export const FamilyTreePrompts = () => {
  const familyTreeStepText = useSelector(getFamilyTreeStepText);
  const currentStep = useFamilyTreeStore((state) => state.step);

  invariant(
    familyTreeStepText,
    'No step text found for FamilyTreeCensus stage',
  );

  return (
    <Prompts
      currentPromptId={currentStep.toString()}
      prompts={familyTreeStepText}
    />
  );
};
