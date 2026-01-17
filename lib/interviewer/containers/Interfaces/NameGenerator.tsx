import { type Form, type Stage } from '@codaco/protocol-validation';
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
import NodeBin from '~/lib/interviewer/components/NodeBin';
import NodeList from '~/lib/interviewer/components/NodeList';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import { usePrompts } from '../../behaviours/withPrompt';
import Prompts from '../../components/Prompts';
import {
  addNode as addNodeAction,
  addNodeToPrompt as addNodeToPromptAction,
  deleteNode as deleteNodeAction,
} from '../../ducks/modules/session';
import { getAdditionalAttributesSelector } from '../../selectors/prop';
import { getCodebookVariablesForSubjectType } from '../../selectors/protocol';
import {
  getNetworkNodesForPrompt,
  getStageNodeCount,
} from '../../selectors/session';
import { useAppDispatch } from '../../store';
import NodeForm from '../NodeForm';
import NodePanels from '../NodePanels';
import { type Direction } from '../ProtocolScreen';
import QuickNodeForm from '../QuickNodeForm';
import { type StageProps } from '../Stage';
import { usePassphrase } from './Anonymisation/usePassphrase';
import { decryptData } from './Anonymisation/utils';
import {
  MaxNodesMet,
  maxNodesWithDefault,
  MinNodesNotMet,
  minNodesWithDefault,
} from './utils/StageLevelValidation';

export const nameGeneratorHandleBeforeLeaving =
  (
    isLastPrompt: boolean,
    stageNodeCount: number,
    minNodes: number,
    setShowMinWarning: (state: boolean) => void,
  ) =>
  (direction: Direction) => {
    if (isLastPrompt && direction === 'forwards' && stageNodeCount < minNodes) {
      setShowMinWarning(true);
      return false;
    }

    return true;
  };

type NameGeneratorProps = StageProps & {
  stage: Extract<Stage, { type: 'NameGeneratorQuickAdd' | 'NameGenerator' }>;
};

const NameGenerator = (props: NameGeneratorProps) => {
  const { registerBeforeNext, stage } = props;

  const { behaviours, type } = stage;

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
  const [showMinWarning, setShowMinWarning] = useState(false);

  const minNodes = minNodesWithDefault(behaviours?.minNodes);
  const maxNodes = maxNodesWithDefault(behaviours?.maxNodes);

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
    (attributes: NcNode[EntityAttributesProperty]) => {
      void dispatch(
        addNodeAction({
          type: stage.subject.type,
          attributeData: attributes,
          useEncryption,
        }),
      );
    },
    [dispatch, stage.subject.type, useEncryption],
  );

  const maxNodesReached = stageNodeCount >= maxNodes;

  useEffect(() => {
    if (stageNodeCount >= minNodes) {
      setShowMinWarning(false);
    }
  }, [stageNodeCount, minNodes]);

  registerBeforeNext(
    nameGeneratorHandleBeforeLeaving(
      isLastPrompt,
      stageNodeCount,
      minNodes,
      setShowMinWarning,
    ),
  );

  /**
   * Drop node handler
   * Adds prompt attributes to existing nodes, or adds new nodes to the network.
   */
  const handleDropNode = (item: { meta: NcNode; target: NcNode }) => {
    const node = { ...item.meta };
    // Test if we are updating an existing network node, or adding it to the network
    if (has(node, 'promptIDs')) {
      void addNodeToPrompt(node[entityPrimaryKeyProperty], newNodeAttributes);
    } else {
      void addNode({ ...node[entityAttributesProperty], ...newNodeAttributes });
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
  const stageElement = document.getElementById('stage');

  return (
    <>
      <div className="name-generator-interface" ref={interfaceRef}>
        <div className="name-generator-interface__prompt">
          <Prompts />
        </div>
        <div className="name-generator-interface__main">
          <div className="name-generator-interface__panels">
            <NodePanels disableAddNew={maxNodesReached} />
          </div>
          <div className="name-generator-interface__nodes">
            <NodeList
              items={nodesForPrompt}
              listId={`${stage.id}_${promptIndex}_MAIN_NODE_LIST`}
              id="MAIN_NODE_LIST"
              accepts={['NEW_NODE']}
              itemType="EXISTING_NODE"
              // @ts-expect-error not yet implemented
              onDrop={handleDropNode}
              onItemClick={handleSelectNode}
            />
          </div>
        </div>
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
      {stageElement &&
        createPortal(
          <MaxNodesMet show={maxNodesReached} timeoutDuration={0} />,
          stageElement,
        )}
      {stageElement &&
        createPortal(
          <MinNodesNotMet
            show={showMinWarning}
            minNodes={minNodes}
            onHideCallback={() => setShowMinWarning(false)}
          />,
          stageElement,
        )}
      {form && (
        <NodeForm
          selectedNode={selectedNode}
          form={form}
          disabled={maxNodesReached || (useEncryption && !passphrase)}
          onClose={() => setSelectedNode(null)}
          addNode={addNode}
        />
      )}
      {!form && (
        <QuickNodeForm
          disabled={maxNodesReached || (useEncryption && !passphrase)}
          targetVariable={quickAdd!}
          onShowForm={() => setShowMinWarning(false)}
          addNode={addNode}
        />
      )}
    </>
  );
};

export default withNoSSRWrapper(NameGenerator);
