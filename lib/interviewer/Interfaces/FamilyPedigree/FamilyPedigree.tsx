import {
  type NcEdge,
  type NcNode,
  type VariableValue,
} from '@codaco/shared-consts';
import { useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';
import { Button } from '@codaco/fresco-ui/Button';
import useDialog from '@codaco/fresco-ui/dialogs/useDialog';
import Prompts from '~/lib/interviewer/components/Prompts/Prompts';
import { useContractFlags } from '~/lib/interviewer/contract/context';
import { toggleNodeAttributes } from '~/lib/interviewer/ducks/modules/session';
import useBeforeNext from '~/lib/interviewer/hooks/useBeforeNext';
import PedigreeChecklist from '~/lib/interviewer/Interfaces/FamilyPedigree/components/PedigreeChecklist';
import EgoCellWizard from '~/lib/interviewer/Interfaces/FamilyPedigree/components/wizards/EgoCellWizard';
import {
  FamilyPedigreeProvider,
  useFamilyPedigreeStore,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/FamilyPedigreeProvider';
import { type VariableConfig } from '~/lib/interviewer/Interfaces/FamilyPedigree/store';
import {
  getEdgeTypeKey,
  getIsActiveVariable,
  getIsGestationalCarrierVariable,
  getRelationshipTypeVariable,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/edgeUtils';
import {
  getEgoVariable,
  getNodeLabelVariable,
  getNodeTypeKey,
} from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/nodeUtils';
import { validatePedigreeCompleteness } from '~/lib/interviewer/Interfaces/FamilyPedigree/utils/validatePedigree';
import {
  getNetworkEdges,
  getNetworkNodes,
  getStageMetadata,
} from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import { type StageProps } from '~/lib/interviewer/types';
import FamilyPedigreePlaceholder from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/components/FamilyPedigreePlaceholder';
import PedigreeView from '~/lib/interviewer/Interfaces/FamilyPedigree/pedigree-layout/components/PedigreeView';

const FamilyPedigree = (props: StageProps<'FamilyPedigree'>) => {
  const {
    stage: { censusPrompt, nominationPrompts },
  } = props;

  const dispatch = useAppDispatch();
  const { confirm, openDialog } = useDialog();
  const { isDevelopment } = useContractFlags();
  const nodesMap = useFamilyPedigreeStore((s) => s.network.nodes);
  const edgesMap = useFamilyPedigreeStore((s) => s.network.edges);
  const addNode = useFamilyPedigreeStore((s) => s.addNode);
  const addEdge = useFamilyPedigreeStore((s) => s.addEdge);
  const updateNode = useFamilyPedigreeStore((s) => s.updateNode);
  const syncMetadata = useFamilyPedigreeStore((s) => s.syncMetadata);
  const clearNetwork = useFamilyPedigreeStore((s) => s.clearNetwork);
  const commitBatch = useFamilyPedigreeStore((s) => s.commitBatch);
  const finalizeNetwork = useFamilyPedigreeStore((s) => s.finalizeNetwork);
  const resetNetwork = useFamilyPedigreeStore((s) => s.resetNetwork);
  const setActiveNominationVariable = useFamilyPedigreeStore(
    (s) => s.setActiveNominationVariable,
  );

  const nodeType = useSelector(getNodeTypeKey);
  const edgeType = useSelector(getEdgeTypeKey);
  const nodeLabelVariable = useSelector(getNodeLabelVariable);
  const egoVariable = useSelector(getEgoVariable);
  const relationshipTypeVariable = useSelector(getRelationshipTypeVariable);
  const isActiveVariable = useSelector(getIsActiveVariable);
  const isGestationalCarrierVariable = useSelector(
    getIsGestationalCarrierVariable,
  );
  const variableConfig: VariableConfig = {
    nodeType,
    edgeType,
    nodeLabelVariable,
    egoVariable,
    relationshipTypeVariable,
    isActiveVariable,
    isGestationalCarrierVariable,
  };

  const allNodes = useSelector(getNetworkNodes);
  const allEdges = useSelector(getNetworkEdges);

  const stageMetadata = useSelector(getStageMetadata) as
    | { isNetworkCommitted?: boolean }
    | undefined;
  const isNetworkCommitted = stageMetadata?.isNetworkCommitted === true;

  const reduxNodesMap = useMemo(
    () => new Map<string, NcNode>(allNodes.map((n) => [n._uid, n])),
    [allNodes],
  );
  const reduxEdgesMap = useMemo(
    () => new Map<string, NcEdge>(allEdges.map((e) => [e._uid, e])),
    [allEdges],
  );
  const handleToggleAttribute = (nodeId: string, variable: string) => {
    const node = allNodes.find((n) => n._uid === nodeId);
    const currentValue = node?.attributes[variable] === true;
    dispatch(
      toggleNodeAttributes({
        nodeId,
        attributes: { [variable]: !currentValue },
      }),
    );
  };

  const egoId = [...nodesMap.entries()].find(
    ([, n]) => n.attributes[egoVariable] === true,
  )?.[0];
  const nonEgoNodeCount = [...nodesMap.values()].filter(
    (n) => n.attributes[egoVariable] !== true,
  ).length;
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
      // Step 0 → finalize before advancing
      if (currentStepIndex === 0) {
        if (isNetworkCommitted) {
          // Already finalized (revisiting) — skip straight to nomination
          setCurrentStepIndex(1);
          updateNominationVariable(1);
        } else if (!hasNodes) {
          // Ego wizard not yet completed
          void openDialog({
            type: 'acknowledge',
            title: 'Pedigree is incomplete',
            description:
              'Please complete the onboarding wizard before continuing.',
            intent: 'destructive',
            actions: {
              primary: { label: 'OK', value: true as const },
            },
          });
        } else {
          // Not finalized — show confirmation dialog
          void handleConfirmAndAdvance();
        }
        return false;
      }

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
      variableConfig,
    );

    if (issues.length > 0) {
      await openDialog({
        type: 'acknowledge',
        title: 'Pedigree is incomplete',
        intent: 'destructive',
        description: 'The following issues must be resolved before finalizing:',
        children: (
          <ul className="list-disc space-y-1 pl-5">
            {issues.map((issue) => (
              <li key={issue.message}>{issue.message}</li>
            ))}
          </ul>
        ),
        actions: {
          primary: { label: 'Return to editing', value: true as const },
        },
      });
      return;
    }

    const result = await confirm({
      title: 'Finalize your family pedigree?',
      description:
        'Once you continue, you will not be able to add or remove family members. You can still edit their details.',
      confirmLabel: 'Finalize',
      cancelLabel: 'Keep editing',
      intent: 'default',
      onConfirm: async () => {
        await finalizeNetwork();
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
        'This will delete all family members and relationships. This action cannot be undone.',
      confirmLabel: 'Reset',
      cancelLabel: 'Cancel',
      intent: 'destructive',
      onConfirm: () => {
        resetNetwork();
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
          {isDevelopment && (
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
                      nodes: Record<string, NcNode>;
                      edges: Record<
                        string,
                        {
                          from: string;
                          to: string;
                          attributes: Record<string, unknown>;
                        }
                      >;
                    };
                    clearNetwork();
                    for (const [id, node] of Object.entries(data.nodes)) {
                      addNode({
                        id,
                        attributes: node.attributes as Record<
                          string,
                          VariableValue
                        >,
                      });
                    }
                    for (const [id, edge] of Object.entries(data.edges)) {
                      addEdge({
                        id,
                        from: edge.from,
                        to: edge.to,
                        attributes: edge.attributes as Record<
                          string,
                          VariableValue
                        >,
                      });
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
                  Your family pedigree will appear here. Click the button below
                  to get started.
                </Paragraph>
              </div>
            </>
          ) : (
            <>
              {isNetworkCommitted && currentStepIndex > 0 ? (
                <PedigreeView
                  overrideNodes={reduxNodesMap}
                  overrideEdges={reduxEdgesMap}
                  activeNominationVariable={
                    allPrompts[currentStepIndex]?.variable ?? null
                  }
                  onToggleAttribute={handleToggleAttribute}
                />
              ) : (
                <PedigreeView />
              )}
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
                updateNode(egoId, result.egoAttributes);
              }
              void openDialog({
                type: 'acknowledge',
                title: 'Building the rest of your pedigree',
                children: (
                  <div className="tablet-landscape:flex-row flex flex-col items-start gap-6">
                    <div>
                      <Paragraph intent="lead">
                        You now need to add family members to build out your
                        pedigree.
                      </Paragraph>
                      <Paragraph>
                        Click on any person in the diagram to open a menu where
                        you can add parents, children, partners, and siblings.
                        Not all options are available for every person — the
                        menu will show the actions relevant to that family
                        member.
                      </Paragraph>
                      <Paragraph>
                        Please try to be as thorough as possible. Use the
                        checklist to keep track of your progress.
                      </Paragraph>
                      <Paragraph>
                        When you are finished, click the next button to
                        continue.
                      </Paragraph>
                    </div>
                    <figure className="phone-landscape:flex hidden shrink-0 flex-col items-center gap-2">
                      <img
                        src="/images/pedigree-context-menu-hint.png"
                        alt="Example of the context menu showing options to add parent, child, partner, sibling, edit name, or delete"
                        className="w-40 rounded-lg shadow-lg"
                      />
                      <figcaption className="text-muted text-xs">
                        Click a person to see this menu
                      </figcaption>
                    </figure>
                  </div>
                ),
                actions: {
                  primary: { label: 'Got it', value: true as const },
                },
              });
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
