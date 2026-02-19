'use client';

import { type Form } from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  entityAttributesProperty,
  type EntityPrimaryKey,
  entityPrimaryKeyProperty,
  entitySecureAttributesMeta,
  type NcNode,
} from '@codaco/shared-consts';
import { has } from 'es-toolkit/compat';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { ResizableFlexPanel } from '~/components/ui/ResizableFlexPanel';
import usePortalTarget from '~/hooks/usePortalTarget';
import NodeBin from '~/lib/interviewer/components/NodeBin';
import NodeList from '~/lib/interviewer/components/NodeList';
import Prompts from '../../components/Prompts';
import { usePrompts } from '../../components/Prompts/usePrompts';
import { type StageProps } from '~/lib/interviewer/types';
import {
  addNode as addNodeAction,
  addNodeToPrompt as addNodeToPromptAction,
  deleteNode as deleteNodeAction,
} from '../../ducks/modules/session';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import useStageValidation from '~/lib/interviewer/hooks/useStageValidation';
import { getAdditionalAttributesSelector } from '../../selectors/prop';
import { getCodebookVariablesForSubjectType } from '../../selectors/protocol';
import {
  getNetworkNodesForPrompt,
  getStageNodeCount,
} from '../../selectors/session';
import { useAppDispatch } from '../../store';
import { usePassphrase } from '../Anonymisation/usePassphrase';
import { decryptData } from '../Anonymisation/utils';
import NodeForm from './components/NodeForm';
import NodePanels from './components/NodePanels';
import QuickNodeForm from './components/QuickNodeForm';

type NameGeneratorProps = StageProps<'NameGeneratorQuickAdd' | 'NameGenerator'>;

const NameGenerator = (props: NameGeneratorProps) => {
  const { registerBeforeNext, stage } = props;

  const { behaviours, type, panels } = stage;

  let quickAdd: string | null = null;
  let form: Form | null = null;

  if (type === 'NameGeneratorQuickAdd') {
    quickAdd = stage.quickAdd;
  }

  if (type === 'NameGenerator') {
    form = stage.form;
  }

  const interfaceRef = useRef(null);

  const { isLastPrompt, promptIndex } = usePrompts();
  const { requirePassphrase, passphrase } = usePassphrase();

  const [selectedNode, setSelectedNode] = useState<NcNode | null>(null);
  const [isPanelsOpen, setIsPanelsOpen] = useState(false);

  const minNodes = behaviours?.minNodes ?? 0;
  const maxNodes = behaviours?.maxNodes ?? Infinity;

  const stageNodeCount = useSelector(getStageNodeCount);
  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);
  const nodesForPrompt = useSelector(getNetworkNodesForPrompt);
  const codebookForNodeType = useSelector(getCodebookVariablesForSubjectType);

  const dispatch = useAppDispatch();

  const useEncryption = useMemo(() => {
    if (
      Object.keys(newNodeAttributes).some(
        (variableId) => codebookForNodeType[variableId]?.encrypted,
      )
    ) {
      return true;
    }

    // Check if the quickAdd variable or form has an encrypted variable
    if (stage.type === 'NameGeneratorQuickAdd') {
      return !!codebookForNodeType[stage.quickAdd]?.encrypted;
    }

    // Check if the form has any variables that are encrypted
    if (stage.type === 'NameGenerator') {
      const formVariables = stage.form.fields.map((field) => field.variable);
      return formVariables.some(
        (variable) => codebookForNodeType[variable]?.encrypted,
      );
    }

    return false;
  }, [stage, codebookForNodeType, newNodeAttributes]);

  useEffect(() => {
    if (useEncryption) {
      requirePassphrase();
    }
  }, [useEncryption, requirePassphrase]);

  const addNodeToPrompt = useCallback(
    (
      nodeId: NcNode[EntityPrimaryKey],
      promptAttributes: Record<string, boolean> = {},
    ) =>
      dispatch(
        addNodeToPromptAction({
          nodeId,
          promptAttributes,
        }),
      ),
    [dispatch],
  );

  const deleteNode = useCallback(
    (uid: NcNode[EntityPrimaryKey]) => {
      dispatch(deleteNodeAction(uid));
    },
    [dispatch],
  );

  const addNode = useCallback(
    async (
      attributes: NcNode[EntityAttributesProperty],
      options?: {
        allowUnknownAttributes?: boolean;
        modelData?: { [entityPrimaryKeyProperty]: NcNode[EntityPrimaryKey] };
      },
    ) => {
      await dispatch(
        addNodeAction({
          type: stage.subject.type,
          attributeData: attributes,
          useEncryption,
          allowUnknownAttributes: options?.allowUnknownAttributes,
          modelData: options?.modelData,
        }),
      );
    },
    [dispatch, stage.subject.type, useEncryption],
  );

  const maxNodesReached = stageNodeCount >= maxNodes;

  const { updateReady } = useReadyForNextStage();
  const { showToast, closeToast } = useStageValidation({
    registerBeforeNext,
    constraints: [
      {
        direction: 'forwards',
        isMet: stageNodeCount >= minNodes || !isLastPrompt,
        toast: {
          description: (
            <>
              You must create at least <strong>{minNodes}</strong>{' '}
              {minNodes > 1 ? 'items' : 'item'} before you can continue.
            </>
          ),
          variant: 'destructive',
          anchor: 'forward',
          timeout: 4000,
        },
      },
    ],
  });

  const maxToastRef = useRef<string | null>(null);

  useEffect(() => {
    if (maxNodesReached) {
      maxToastRef.current = showToast({
        description:
          'You have added the maximum number of items for this screen.',
        variant: 'info',
        anchor: 'forward',
        timeout: 0,
      });
      updateReady(true);
    } else if (maxToastRef.current) {
      closeToast(maxToastRef.current);
      maxToastRef.current = null;
      updateReady(false);
    }

    return () => {
      if (maxToastRef.current) {
        closeToast(maxToastRef.current);
      }
      updateReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxNodesReached]);

  /**
   * Drop node handler
   * Adds prompt attributes to existing nodes, or adds new nodes to the network.
   */
  const handleDropNode = (metadata?: Record<string, unknown>) => {
    const node = metadata as NcNode | undefined;
    if (!node) return;

    // Test if we are updating an existing network node, or adding it to the network
    if (has(node, 'promptIDs')) {
      void addNodeToPrompt(node[entityPrimaryKeyProperty], newNodeAttributes);
    } else {
      // Panel nodes may come from external data with attributes not in the codebook
      void addNode(
        { ...node[entityAttributesProperty], ...newNodeAttributes },
        {
          allowUnknownAttributes: true,
          modelData: {
            [entityPrimaryKeyProperty]: node[entityPrimaryKeyProperty],
          },
        },
      );
    }
  };

  // When a node is tapped, trigger editing.
  const handleSelectNode = useCallback(
    async (node: NcNode) => {
      if (!form || (useEncryption && !passphrase)) {
        return;
      }

      // Decrypt node attributes if required.
      if (useEncryption && passphrase) {
        // Map the node's attributes, check the codebook encrypted property, and pass to decryptData if required.
        const decryptedAttributes = await Promise.all(
          Object.entries(node[entityAttributesProperty]).map(
            async ([variableId, value]) => {
              if (codebookForNodeType[variableId]?.encrypted) {
                const secureAttributes = node[entitySecureAttributesMeta];
                if (!secureAttributes?.[variableId]) {
                  throw new Error(
                    `Secure attributes missing for ${variableId} on node ${node[entityPrimaryKeyProperty]}`,
                  );
                }

                const decrypted = await decryptData(
                  {
                    secureAttributes: secureAttributes[variableId],
                    data: value as number[],
                  },
                  passphrase,
                );

                return [variableId, decrypted];
              }
              return [variableId, value];
            },
          ),
        );

        const decryptedNode: NcNode = {
          ...node,
          [entityAttributesProperty]: Object.fromEntries(
            decryptedAttributes,
          ) as NcNode[EntityAttributesProperty],
        };

        setSelectedNode(decryptedNode);
        return;
      } else {
        setSelectedNode(node);
      }
    },
    [form, passphrase, useEncryption, codebookForNodeType],
  );

  const stageElement = usePortalTarget('stage');

  return (
    <>
      <div className="interface min-h-0 flex-col gap-6" ref={interfaceRef}>
        <Prompts />
        {panels ? (
          <ResizableFlexPanel
            storageKey="name-generator-panels"
            defaultBasis={30}
            min={15}
            max={60}
            breakpoints={[
              { value: 25, label: '25% panels' },
              { value: 33, label: 'One-third panels' },
              { value: 50, label: 'Equal split' },
            ]}
            overrideBasis={isPanelsOpen ? undefined : 0}
            className="min-h-0 w-full flex-1 basis-full"
            aria-label="Resize panel and node list areas"
          >
            <NodePanels
              disableAddNew={maxNodesReached}
              onOpenChange={setIsPanelsOpen}
              animationKey={promptIndex}
            />
            <NodeList
              items={nodesForPrompt}
              id="MAIN_NODE_LIST"
              accepts={['NEW_NODE']}
              itemType="EXISTING_NODE"
              onDrop={handleDropNode}
              onItemClick={handleSelectNode}
              animationKey={promptIndex}
              className="flex flex-1 rounded"
            />
          </ResizableFlexPanel>
        ) : (
          <div className="flex min-h-0 w-full flex-1 basis-full gap-4">
            <NodeList
              items={nodesForPrompt}
              id="MAIN_NODE_LIST"
              accepts={['NEW_NODE']}
              itemType="EXISTING_NODE"
              onDrop={handleDropNode}
              onItemClick={handleSelectNode}
              animationKey={promptIndex}
              className="flex flex-1 rounded"
            />
          </div>
        )}
        {form ? (
          <NodeForm
            selectedNode={selectedNode}
            form={form}
            disabled={maxNodesReached || (useEncryption && !passphrase)}
            onClose={() => setSelectedNode(null)}
            addNode={addNode}
          />
        ) : (
          <QuickNodeForm
            disabled={maxNodesReached || (useEncryption && !passphrase)}
            targetVariable={quickAdd!}
            addNode={addNode}
          />
        )}
      </div>
      {stageElement &&
        createPortal(
          <NodeBin
            accepts={(node: NcNode & { itemType?: string }) =>
              node.itemType === 'EXISTING_NODE'
            }
            dropHandler={(meta: NcNode) =>
              deleteNode(meta[entityPrimaryKeyProperty])
            }
          />,
          stageElement,
        )}
    </>
  );
};

export default NameGenerator;
