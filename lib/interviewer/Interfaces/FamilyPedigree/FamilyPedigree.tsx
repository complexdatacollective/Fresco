import { type NcNode } from '@codaco/shared-consts';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import usePortalTarget from '~/hooks/usePortalTarget';
import NodeBin from '~/lib/interviewer/components/NodeBin';
import Prompts from '~/lib/interviewer/components/Prompts/Prompts';
import { deleteNode } from '~/lib/interviewer/ducks/modules/session';
import useBeforeNext from '~/lib/interviewer/hooks/useBeforeNext';
import QuickStartForm from '~/lib/interviewer/Interfaces/FamilyPedigree/components/QuickStartForm';
import {
  FamilyPedigreeProvider,
  useFamilyPedigreeStore,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/FamilyPedigreeProvider';
import {
  getNetworkEdges,
  getNetworkEgo,
  getNetworkNodes,
} from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import PedigreeView from '~/lib/pedigree-layout/components/PedigreeView';
import { type StageProps } from '../../types';

const FamilyPedigree = (props: StageProps<'FamilyPedigree'>) => {
  const {
    stage: { censusPrompt, edgeConfig, nodeConfig, nominationPrompts },
  } = props;

  const dispatch = useAppDispatch();
  const nodesMap = useFamilyPedigreeStore((s) => s.network.nodes);
  const removeNode = useFamilyPedigreeStore((s) => s.removeNode);
  const syncMetadata = useFamilyPedigreeStore((s) => s.syncMetadata);
  const generateQuickStartNetwork = useFamilyPedigreeStore(
    (s) => s.generateQuickStartNetwork,
  );

  const nonEgoNodeCount = [...nodesMap.values()].filter((n) => !n.isEgo).length;
  const hasNodes = nonEgoNodeCount > 0;

  const scaffoldingPrompt = {
    id: 'scaffolding',
    text: censusPrompt,
  };
  const allPrompts = [scaffoldingPrompt, ...(nominationPrompts ?? [])] as {
    id: string;
    text: string;
    variable?: string;
  }[];

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
  const showQuickStart = currentStepIndex === 0 && !hasNodes;

  return (
    <>
      <div className="interface">
        <Prompts
          prompts={allPrompts}
          currentPromptId={allPrompts[currentStepIndex]?.id}
          className="shrink-0"
        />
        <div className="relative flex grow items-center justify-center">
          {showQuickStart ? (
            <QuickStartForm
              onSubmit={(data) => {
                generateQuickStartNetwork(data);
                syncMetadata();
              }}
            />
          ) : (
            <PedigreeView />
          )}
        </div>
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

export default function FamilyPedigreeWithProvider(props: FamilyPedigreeProps) {
  const ego = useSelector(getNetworkEgo);
  const allNodes = useSelector(getNetworkNodes);
  const allEdges = useSelector(getNetworkEdges);
  const { stage } = props;
  const diseaseVariables =
    stage.diseaseNominationStep?.map((diseaseStep) => diseaseStep.variable) ??
    [];
  return (
    <FamilyPedigreeProvider
      ego={ego}
      nodes={allNodes}
      edges={allEdges}
      diseaseVariables={diseaseVariables}
    >
      <FamilyPedigree {...props} />
    </FamilyPedigreeProvider>
  );
}
