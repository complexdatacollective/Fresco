import { type Stage } from '@codaco/protocol-validation';
import { type NcNode } from '@codaco/shared-consts';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import NodeBin from '~/lib/interviewer/components/NodeBin';
import { type StageProps } from '~/lib/interviewer/containers/Stage';
import Prompts from '~/lib/ui/components/Prompts/Prompts';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import { FamilyTreeShells } from './components/FamilyTreeShells';
import { FamilyTreeProvider, useFamilyTreeStore } from './FamilyTreeProvider';

const DiseaseNomination = () => {
  return <div>Family tree completion</div>;
};

type FamilyTreeCensusProps = StageProps & {
  stage: Extract<Stage, { type: 'FamilyTreeCensus' }>;
};

/**
 * Given a FamilyTreeCensus stage, return the ordered list of steps,
 * including steps for each disease nomination step if present.
 *
 * Provide an ascending numerical index, starting at 0
 */
const getStageSteps = (
  stage: FamilyTreeCensusProps['stage'],
): Map<
  number,
  {
    promptText: string;
    component: React.ComponentType;
  }
> => {
  const steps = new Map<
    number,
    {
      promptText: string;
      component: React.ComponentType;
    }
  >();

  let stepIndex = 0;

  // Scaffolding step
  steps.set(stepIndex, {
    promptText: stage.scaffoldingStep.text,
    component: FamilyTreeShells,
  });
  stepIndex += 1;

  // Name generation step
  steps.set(stepIndex, {
    promptText: stage.nameGenerationStep.text,
    component: FamilyTreeShells,
  });
  stepIndex += 1;

  // Disease nomination steps, if any
  if (stage.diseaseNominationStep) {
    for (const diseaseStep of stage.diseaseNominationStep) {
      steps.set(stepIndex, {
        promptText: diseaseStep.text,
        component: DiseaseNomination,
      });
      stepIndex += 1;
    }
  }

  return steps;
};

const FamilyTreeCensus = (props: FamilyTreeCensusProps) => {
  const { registerBeforeNext, stage } = props;

  /**
   * Steps:
   *  1. Scaffolding step, with optional quick start modal
   *  2. Name generation, with name interpretation via form
   *  3. Disease nomination (optional)
   */
  const steps = getStageSteps(stage);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  registerBeforeNext((direction) => {
    if (direction === 'forwards') {
      const isLastStep = currentStepIndex === steps.size - 1;
      if (isLastStep) {
        return true;
      }

      setCurrentStepIndex((prev) => prev + 1);
      return false;
    } else if (direction === 'backwards') {
      if (currentStepIndex === 0) {
        return true;
      }

      setCurrentStepIndex((prev) => prev - 1);
      return false;
    }
    return false;
  });

  const CurrentStepComponent = steps.get(currentStepIndex)?.component;

  const stageElement = document.getElementById('stage');
  const removeNode = useFamilyTreeStore((state) => state.removeNode);

  return (
    <>
      <div className="flex grow flex-col gap-4">
        <Prompts
          prompts={Array.from(steps.entries()).map(([id, { promptText }]) => ({
            id: id.toString(),
            text: promptText,
          }))}
          currentPromptId={currentStepIndex.toString()}
          className="shrink-0"
        />
        {CurrentStepComponent && <CurrentStepComponent />}
      </div>
      {stageElement &&
        createPortal(
          <NodeBin
            dropHandler={(node) => {
              removeNode(node.placeholderId);
            }}
            accepts={(node: NcNode & { itemType?: string }) =>
              node.itemType === 'FAMILY_TREE_NODE'
            }
          />,
          stageElement,
        )}
    </>
  );
};

export default withNoSSRWrapper((props: FamilyTreeCensusProps) => (
  <FamilyTreeProvider>
    <FamilyTreeCensus {...props} />
  </FamilyTreeProvider>
));
