import { type Stage } from '@codaco/protocol-validation';
import { type NcNode } from '@codaco/shared-consts';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { Toaster } from '~/components/ui/toaster';
import { useToast } from '~/components/ui/use-toast';
import NodeBin from '~/lib/interviewer/components/NodeBin';
import { type StageProps } from '~/lib/interviewer/containers/Stage';
import { addEdge, deleteNode } from '~/lib/interviewer/ducks/modules/session';
import {
  getNetworkEdges,
  getNetworkEgo,
  getNetworkNodes,
} from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import Prompts from '~/lib/ui/components/Prompts/Prompts';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import { getEdgeType } from './components/EdgeRenderer';
import { FamilyTreeShells } from './components/FamilyTreeShells';
import { FamilyTreeProvider, useFamilyTreeStore } from './FamilyTreeProvider';
import { getRelationshipTypeVariable } from './utils/edgeUtils';

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
    diseaseVariable: string | null;
  }
> => {
  const steps = new Map<
    number,
    {
      promptText: string;
      diseaseVariable: string | null;
    }
  >();

  let stepIndex = 0;

  // Scaffolding step
  steps.set(stepIndex, {
    promptText: stage.scaffoldingStep.text,
    diseaseVariable: null,
  });
  stepIndex += 1;

  // Name generation step
  steps.set(stepIndex, {
    promptText: stage.nameGenerationStep.text,
    diseaseVariable: null,
  });
  stepIndex += 1;

  // Disease nomination steps, if any
  if (stage.diseaseNominationStep) {
    for (const diseaseStep of stage.diseaseNominationStep) {
      steps.set(stepIndex, {
        promptText: diseaseStep.text,
        diseaseVariable: diseaseStep.variable,
      });
      stepIndex += 1;
    }
  }

  return steps;
};

const FamilyTreeCensus = (props: FamilyTreeCensusProps) => {
  const { registerBeforeNext, stage } = props;

  const networkNodes = useSelector(getNetworkNodes);
  const networkEdges = useSelector(getNetworkEdges);
  const dispatch = useAppDispatch();
  const edgesMap = useFamilyTreeStore((state) => state.network.edges);
  const edges = Array.from(
    edgesMap.entries().map(([id, edge]) => ({ id, ...edge })),
  );
  const edgeType = useSelector(getEdgeType);
  const relationshipVariable = useSelector(getRelationshipTypeVariable);
  const saveEdges = () => {
    edges.forEach((edge) => {
      void dispatch(
        addEdge({
          from: edge.source,
          to: edge.target,
          type: edgeType,
          attributeData: { [relationshipVariable]: edge.relationship },
        }),
      );
    });
  };
  const nodesMap = useFamilyTreeStore((state) => state.network.nodes);
  const missingNames = () => {
    return nodesMap.values().some((value) => value.interviewNetworkId == null);
  };
  const { toast } = useToast();

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
      const isNameGenerationStep = currentStepIndex === 1;
      if (isNameGenerationStep && missingNames()) {
        toast({
          title: 'Error',
          description:
            'Please enter information for all nodes in the tree before continuing.',
          variant: 'destructive',
        });
        return false;
      }
      const isLastStep = currentStepIndex === steps.size - 1;
      if (isLastStep) {
        saveEdges();
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

  const diseaseVariable = steps.get(currentStepIndex)?.diseaseVariable ?? null;

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
        <FamilyTreeShells
          stage={stage}
          diseaseVariable={diseaseVariable}
          stepIndex={currentStepIndex}
          networkNodes={networkNodes}
          networkEdges={networkEdges}
        />
      </div>
      {stageElement &&
        createPortal(
          <NodeBin
            dropHandler={(node, metadata) => {
              const shellNode = metadata as Record<string, string>;
              const placeholderId = shellNode?.placeholderId;
              if (!placeholderId) return;

              const interviewId =
                nodesMap.get(placeholderId)?.interviewNetworkId;
              if (interviewId) dispatch(deleteNode(interviewId));

              removeNode(placeholderId);
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

export default withNoSSRWrapper((props: FamilyTreeCensusProps) => {
  const ego = useSelector(getNetworkEgo);
  const allNodes = useSelector(getNetworkNodes);
  const allEdges = useSelector(getNetworkEdges);
  const { stage } = props;
  const diseaseVariables =
    stage.diseaseNominationStep?.map((diseaseStep) => diseaseStep.variable) ??
    [];
  return (
    <FamilyTreeProvider
      ego={ego}
      nodes={allNodes}
      edges={allEdges}
      diseaseVariables={diseaseVariables}
    >
      <FamilyTreeCensus {...props} />
      <Toaster />
    </FamilyTreeProvider>
  );
});
