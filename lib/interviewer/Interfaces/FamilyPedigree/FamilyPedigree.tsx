import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Paragraph from '~/components/typography/Paragraph';
import { Button } from '~/components/ui/Button';
import { env } from '~/env.js';
import useDialog from '~/lib/dialogs/useDialog';
import Prompts from '~/lib/interviewer/components/Prompts/Prompts';
import { updateStageMetadata } from '~/lib/interviewer/ducks/modules/session';
import useBeforeNext from '~/lib/interviewer/hooks/useBeforeNext';
import PedigreeChecklist from '~/lib/interviewer/Interfaces/FamilyPedigree/components/PedigreeChecklist';
import EgoCellWizard from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/EgoCellWizard';
import {
  FamilyPedigreeProvider,
  useFamilyPedigreeStore,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/FamilyPedigreeProvider';
import {
  type NodeData,
  type StoreEdge,
  type VariableConfig,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import {
  getIsActiveVariable,
  getIsGestationalCarrierVariable,
  getRelationshipTypeVariable,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/edgeUtils';
import {
  getEgoVariable,
  getNodeLabelVariable,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';
import { validatePedigreeCompleteness } from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/validatePedigree';
import {
  getNetworkEdges,
  getNetworkNodes,
  getStageMetadata,
} from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import { type StageProps } from '~/lib/interviewer/types';
import FamilyPedigreePlaceholder from '~/lib/pedigree-layout/components/FamilyPedigreePlaceholder';
import PedigreeView from '~/lib/pedigree-layout/components/PedigreeView';

const FamilyPedigree = (props: StageProps<'FamilyPedigree'>) => {
  const {
    stage: { censusPrompt, nominationPrompts },
  } = props;

  const dispatch = useAppDispatch();
  const { confirm } = useDialog();
  const nodesMap = useFamilyPedigreeStore((s) => s.network.nodes);
  const edgesMap = useFamilyPedigreeStore((s) => s.network.edges);
  const addNode = useFamilyPedigreeStore((s) => s.addNode);
  const addEdge = useFamilyPedigreeStore((s) => s.addEdge);
  const updateNode = useFamilyPedigreeStore((s) => s.updateNode);
  const syncMetadata = useFamilyPedigreeStore((s) => s.syncMetadata);
  const clearNetwork = useFamilyPedigreeStore((s) => s.clearNetwork);
  const commitBatch = useFamilyPedigreeStore((s) => s.commitBatch);
  const setActiveNominationVariable = useFamilyPedigreeStore(
    (s) => s.setActiveNominationVariable,
  );

  const nodeLabelVariable = useSelector(getNodeLabelVariable);
  const egoVariable = useSelector(getEgoVariable);
  const relationshipTypeVariable = useSelector(getRelationshipTypeVariable);
  const isActiveVariable = useSelector(getIsActiveVariable);
  const isGestationalCarrierVariable = useSelector(
    getIsGestationalCarrierVariable,
  );
  const variableConfig: VariableConfig = {
    nodeLabelVariable,
    egoVariable,
    relationshipTypeVariable,
    isActiveVariable,
    isGestationalCarrierVariable,
  };

  const stageMetadata = useSelector(getStageMetadata) as
    | { isNetworkCommitted?: boolean }
    | undefined;
  const isNetworkCommitted = stageMetadata?.isNetworkCommitted === true;

  const egoId = [...nodesMap.entries()].find(([, n]) => n.isEgo)?.[0];
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

  const updateNominationVariable = (stepIndex: number) => {
    const prompt = allPrompts[stepIndex];
    setActiveNominationVariable(prompt?.variable ?? null);
  };

  useBeforeNext((direction) => {
    if (direction === 'forwards') {
      const isLastStep = currentStepIndex === allPrompts.length - 1;
      if (isLastStep) {
        syncMetadata();
        return true;
      }

      const nextStep = currentStepIndex + 1;
      setCurrentStepIndex(nextStep);
      updateNominationVariable(nextStep);
      return false;
    } else if (direction === 'backwards') {
      if (currentStepIndex === 0) {
        return true;
      }

      const prevStep = currentStepIndex - 1;
      setCurrentStepIndex(prevStep);
      updateNominationVariable(prevStep);
      return false;
    }
    return false;
  });

  const handleConfirmAndAdvance = async () => {
    const issues = validatePedigreeCompleteness(
      nodesMap,
      edgesMap,
      nodeLabelVariable,
    );

    if (issues.length > 0) {
      const issueList = issues.map((i) => i.message).join('\n');
      await confirm({
        title: 'Pedigree is incomplete',
        description: `The following issues must be resolved before finalizing:\n\n${issueList}`,
        confirmLabel: 'OK',
        intent: 'default',
        onConfirm: () => undefined,
      });
      return;
    }

    const result = await confirm({
      title: 'Finalize your family pedigree?',
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
      updateNominationVariable(1);
    }
  };

  const handleResetPedigree = async () => {
    await confirm({
      title: 'Reset family pedigree?',
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

  const containerRef = useRef<HTMLDivElement>(null);
  const showQuickStart = currentStepIndex === 0 && !hasNodes;
  const showResetOption =
    currentStepIndex === 0 && hasNodes && isNetworkCommitted;

  return (
    <>
      <div className="interface p-0">
        <Prompts
          prompts={allPrompts}
          currentPromptId={allPrompts[currentStepIndex]?.id}
          className="phone-landscape:px-4 phone-landscape:pt-4 tablet-landscape:px-6 tablet-landscape:pt-6 desktop:px-8 shrink-0 px-2 pt-2"
        />
        <div
          ref={containerRef}
          className="relative flex size-full grow items-center justify-center"
        >
          {env.NODE_ENV === 'development' && (
            <div className="absolute top-2 right-2 z-50 flex gap-1">
              <button
                type="button"
                className="rounded bg-black/50 px-2 py-1 text-xs text-white opacity-50 hover:opacity-100"
                onClick={() => {
                  const json = JSON.stringify(
                    {
                      nodes: Object.fromEntries(
                        [...nodesMap.entries()].map(([id, n]) => [id, n]),
                      ),
                      edges: Object.fromEntries(
                        [...edgesMap.entries()].map(([id, e]) => [id, e]),
                      ),
                    },
                    null,
                    2,
                  );
                  void navigator.clipboard.writeText(json);
                }}
              >
                Dump
              </button>
              <button
                type="button"
                className="rounded bg-black/50 px-2 py-1 text-xs text-white opacity-50 hover:opacity-100"
                onClick={() => {
                  const json = window.prompt('Paste network JSON:');
                  if (!json) return;
                  try {
                    const data = JSON.parse(json) as {
                      nodes: Record<string, NodeData>;
                      edges: Record<string, StoreEdge>;
                    };
                    clearNetwork();
                    for (const [id, node] of Object.entries(data.nodes)) {
                      addNode({ id, ...node });
                    }
                    for (const [id, edge] of Object.entries(data.edges)) {
                      addEdge({ id, ...edge });
                    }
                  } catch {
                    // eslint-disable-next-line no-console
                    console.error('Failed to parse network JSON');
                  }
                }}
              >
                Load
              </button>
            </div>
          )}
          {showQuickStart ? (
            <>
              <div className="flex flex-col items-center gap-6">
                <FamilyPedigreePlaceholder className="w-96 max-w-full opacity-25" />
                <Paragraph
                  emphasis="muted"
                  margin="none"
                  className="text-center"
                >
                  Your family pedigree will appear here
                </Paragraph>
              </div>
            </>
          ) : (
            <>
              <PedigreeView />
              {currentStepIndex === 0 && hasNodes && !isNetworkCommitted && (
                <PedigreeChecklist
                  dragConstraints={containerRef}
                  onFinalize={() => void handleConfirmAndAdvance()}
                />
              )}
              {showResetOption && (
                <div className="absolute bottom-4 flex flex-col items-center gap-2">
                  <Paragraph emphasis="muted" margin="none">
                    Your family pedigree has been finalized.
                  </Paragraph>
                  <Button
                    size="sm"
                    color="destructive"
                    onClick={() => void handleResetPedigree()}
                  >
                    Reset family pedigree
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        {showQuickStart && (
          <EgoCellWizard
            egoId={egoId}
            onSubmit={(result) => {
              commitBatch(result.batch);
              if (egoId && result.egoAttributes) {
                updateNode(egoId, { attributes: result.egoAttributes });
              }
            }}
            variableConfig={variableConfig}
          />
        )}
      </div>
    </>
  );
};

export default function FamilyPedigreeWithProvider(
  props: StageProps<'FamilyPedigree'>,
) {
  const allNodes = useSelector(getNetworkNodes);
  const allEdges = useSelector(getNetworkEdges);
  return (
    <FamilyPedigreeProvider nodes={allNodes} edges={allEdges}>
      <FamilyPedigree {...props} />
    </FamilyPedigreeProvider>
  );
}
