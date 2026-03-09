import { type NcNode } from '@codaco/shared-consts';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import usePortalTarget from '~/hooks/usePortalTarget';
import NodeBin from '~/lib/interviewer/components/NodeBin';
import Prompts from '~/lib/interviewer/components/Prompts/Prompts';
import { deleteNode } from '~/lib/interviewer/ducks/modules/session';
import useBeforeNext from '~/lib/interviewer/hooks/useBeforeNext';
import PedigreeView from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/PedigreeView';
import QuickStartForm from '~/lib/interviewer/Interfaces/FamilyTreeCensus/components/QuickStartForm';
import {
  FamilyTreeProvider,
  useFamilyTreeStore,
} from '~/lib/interviewer/Interfaces/FamilyTreeCensus/FamilyTreeProvider';
import {
  getNetworkEdges,
  getNetworkEgo,
  getNetworkNodes,
} from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import { type StageProps } from '~/lib/interviewer/types';

type FamilyTreeCensusProps = StageProps<'FamilyTreeCensus'>;

type DiseaseStep = {
  promptText: string;
  diseaseVariable: string;
};

const FamilyTreeCensus = (props: FamilyTreeCensusProps) => {
  const { stage } = props;

  const dispatch = useAppDispatch();
  const nodesMap = useFamilyTreeStore((s) => s.network.nodes);
  const removeNode = useFamilyTreeStore((s) => s.removeNode);
  const syncMetadata = useFamilyTreeStore((s) => s.syncMetadata);
  const generateQuickStartNetwork = useFamilyTreeStore(
    (s) => s.generateQuickStartNetwork,
  );

  const quickStart = (stage as Record<string, unknown>).quickStart as
    | { enabled?: boolean; prompt?: string }
    | undefined;
  const quickStartEnabled = quickStart?.enabled === true;
  const hasNodes = nodesMap.size > 0;

  const diseaseSteps: DiseaseStep[] =
    stage.diseaseNominationStep?.map((d) => ({
      promptText: d.text,
      diseaseVariable: d.variable,
    })) ?? [];

  const scaffoldingPrompt = {
    id: 'scaffolding',
    text: stage.scaffoldingStep.text,
  };
  const allPrompts = [
    scaffoldingPrompt,
    ...diseaseSteps.map((d, i) => ({
      id: `disease-${i}`,
      text: d.promptText,
    })),
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useBeforeNext((direction) => {
    if (direction === 'forwards') {
      const isLastStep = currentStepIndex === allPrompts.length - 1;
      if (isLastStep) {
        syncMetadata();
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

  const stageElement = usePortalTarget('stage');

  const showQuickStart =
    currentStepIndex === 0 && !hasNodes && quickStartEnabled;

  return (
    <>
      <div className="flex grow flex-col gap-4">
        <Prompts
          prompts={allPrompts}
          currentPromptId={allPrompts[currentStepIndex]?.id}
          className="shrink-0"
        />

        {showQuickStart ? (
          <QuickStartForm
            prompt={quickStart?.prompt ?? stage.scaffoldingStep.text}
            onSubmit={(data) => {
              generateQuickStartNetwork(data);
              syncMetadata();
            }}
          />
        ) : (
          <PedigreeView />
        )}
      </div>

      {stageElement &&
        createPortal(
          <NodeBin
            dropHandler={(_node, metadata) => {
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

export default function FamilyTreeCensusWithProvider(
  props: FamilyTreeCensusProps,
) {
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
    </FamilyTreeProvider>
  );
}
