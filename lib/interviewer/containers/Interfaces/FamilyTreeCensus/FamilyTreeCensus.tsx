import { type Stage } from '@codaco/protocol-validation';
import { AnimatePresence } from 'motion/react';
import { type StageProps } from '~/lib/interviewer/containers/Stage';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import { FamilyTreePrompts } from './components/FamilyTreePrompts';
import { FamilyTreeProvider, useFamilyTreeState } from './FamilyTreeProvider';
import { CensusForm } from './steps/CensusForm';
import { FamilyTreeShells } from './steps/FamilyTreeShells';

const FamilyTreeCompletion = () => {
  return <div>Family tree completion</div>;
};

type FamilyTreeCensusProps = StageProps & {
  stage: Extract<Stage, { type: 'FamilyTreeCensus' }>;
};
const FamilyTreeCensus = (props: FamilyTreeCensusProps) => {
  const { registerBeforeNext, stage } = props;

  /**
   * Steps:
   *  1. Census form (number of each type of family member)
   *  2. Family tree shells (placeholders for each family member)
   *  3. Family tree completion (fill in details for each family member)
   */
  const StepComponents = [CensusForm, FamilyTreeShells, FamilyTreeCompletion];

  const [currentStep, setCurrentStep] = useFamilyTreeState(
    (state) => state.step,
    (state) => state.setStep,
  );

  /**
   * Once step one has been completed, it cannot be revisited.
   */
  registerBeforeNext((direction) => {
    if (direction === 'forwards') {
      if (currentStep >= StepComponents.length - 1) {
        return true; // Allow navigation to next stage
      }

      setCurrentStep((s) => s + 1);
      return false;
    } else if (direction === 'backwards') {
      if (currentStep <= 0) {
        return true; // Allow navigation to previous stage
      }

      setCurrentStep((s) => s - 1);
      return false;
    }
    return false;
  });

  const CurrentStepComponent = StepComponents[currentStep];

  return (
    <div className="flex grow flex-col gap-4">
      <div className="flex-shrink-0">
        <FamilyTreePrompts />
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {CurrentStepComponent && <CurrentStepComponent />}
      </AnimatePresence>
    </div>
  );
};

export default withNoSSRWrapper((props: FamilyTreeCensusProps) => (
  <FamilyTreeProvider>
    <FamilyTreeCensus {...props} />
  </FamilyTreeProvider>
));
