import { type NcNode } from '@codaco/shared-consts';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import usePortalTarget from '~/hooks/usePortalTarget';
import useDialog from '~/lib/dialogs/useDialog';
import NodeBin from '~/lib/interviewer/components/NodeBin';
import Prompts from '~/lib/interviewer/components/Prompts/Prompts';
import {
  deleteNode,
  updateStageMetadata,
} from '~/lib/interviewer/ducks/modules/session';
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
  getStageMetadata,
} from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import FamilyPedigreePlaceholder from '~/lib/pedigree-layout/components/FamilyPedigreePlaceholder';
import PedigreeView from '~/lib/pedigree-layout/components/PedigreeView';
import { type StageProps } from '../../types';

const FamilyPedigree = (props: StageProps<'FamilyPedigree'>) => {
  const {
    stage: { censusPrompt, nominationPrompts },
  } = props;

  const dispatch = useAppDispatch();
  const { confirm } = useDialog();
  const nodesMap = useFamilyPedigreeStore((s) => s.network.nodes);
  const removeNode = useFamilyPedigreeStore((s) => s.removeNode);
  const syncMetadata = useFamilyPedigreeStore((s) => s.syncMetadata);
  const clearNetwork = useFamilyPedigreeStore((s) => s.clearNetwork);
  const generateQuickStartNetwork = useFamilyPedigreeStore(
    (s) => s.generateQuickStartNetwork,
  );

  const stageMetadata = useSelector(getStageMetadata) as
    | { isNetworkCommitted?: boolean }
    | undefined;
  const isNetworkCommitted = stageMetadata?.isNetworkCommitted === true;

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

  const handleConfirmAndAdvance = async () => {
    const result = await confirm({
      title: 'Finalize your family tree?',
      description:
        'Once you continue, you will not be able to add or remove family members. You can still edit their details.',
      confirmLabel: 'Continue',
      cancelLabel: 'Keep editing',
      intent: 'default',
      onConfirm: () => {
        syncMetadata();
      },
    });

    if (result === true) {
      setCurrentStepIndex(1);
    }
  };

  const handleResetPedigree = async () => {
    await confirm({
      title: 'Reset family tree?',
      description:
        'This will delete all family members and restart the onboarding wizard. This action cannot be undone.',
      confirmLabel: 'Reset',
      cancelLabel: 'Cancel',
      intent: 'destructive',
      onConfirm: () => {
        clearNetwork();
        dispatch(
          updateStageMetadata({
            isNetworkCommitted: false,
          }),
        );
      },
    });
  };

  const stageElement = usePortalTarget('stage');
  const showQuickStart = currentStepIndex === 0 && !hasNodes;
  const showResetOption =
    currentStepIndex === 0 && hasNodes && isNetworkCommitted;

  return (
    <>
      <div className="interface">
        <Prompts
          prompts={allPrompts}
          currentPromptId={allPrompts[currentStepIndex]?.id}
          className="shrink-0"
        />
        <div className="relative flex size-full grow items-center justify-center">
          {showQuickStart ? (
            <>
              <div className="flex flex-col items-center gap-6">
                <FamilyPedigreePlaceholder className="w-96 max-w-full opacity-25" />
                <Paragraph
                  emphasis="muted"
                  margin="none"
                  className="text-center"
                >
                  Your family tree will appear here
                </Paragraph>
              </div>
            </>
          ) : (
            <>
              <PedigreeView />
              {showResetOption && (
                <div className="absolute bottom-4 flex flex-col items-center gap-2">
                  <Paragraph emphasis="muted" margin="none">
                    Your family tree has been finalized.
                  </Paragraph>
                  <Button
                    size="sm"
                    color="destructive"
                    onClick={() => void handleResetPedigree()}
                  >
                    Reset family tree
                  </Button>
                </div>
              )}
              {currentStepIndex === 0 && hasNodes && !isNetworkCommitted && (
                <div className="absolute bottom-4">
                  <Button
                    color="primary"
                    onClick={() => void handleConfirmAndAdvance()}
                  >
                    Finalize family tree
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        {showQuickStart && (
          <QuickStartForm onSubmit={generateQuickStartNetwork} />
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

export default function FamilyPedigreeWithProvider(
  props: StageProps<'FamilyPedigree'>,
) {
  const ego = useSelector(getNetworkEgo);
  const allNodes = useSelector(getNetworkNodes);
  const allEdges = useSelector(getNetworkEdges);
  const { stage } = props;
  const diseaseVariables =
    stage.nominationPrompts?.map((prompt) => prompt.variable) ?? [];
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
