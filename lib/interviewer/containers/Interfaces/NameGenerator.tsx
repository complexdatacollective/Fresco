import {
  type Form,
  type Stage,
  type StageSubject,
} from '@codaco/protocol-validation';
import {
  type EntityAttributesProperty,
  entityAttributesProperty,
  type EntityPrimaryKey,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { get, has } from 'es-toolkit/compat';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import NodeBin from '~/lib/interviewer/components/NodeBin';
import NodeList from '~/lib/interviewer/components/NodeList';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import { usePrompts } from '../../behaviours/withPrompt';
import Prompts from '../../components/Prompts';
import { getShouldEncryptNames } from '../../ducks/modules/protocol';
import {
  addNode as addNodeAction,
  addNodeToPrompt as addNodeToPromptAction,
  deleteNode as deleteNodeAction,
  updateNode as updateNodeAction,
} from '../../ducks/modules/session';
import usePropSelector from '../../hooks/usePropSelector';
import { getNodeIconName } from '../../selectors/name-generator';
import { getAdditionalAttributesSelector } from '../../selectors/prop';
import {
  getNetworkNodesForPrompt,
  getNodeColor,
  getNodeTypeLabel,
  getStageNodeCount,
} from '../../selectors/session';
import { useAppDispatch } from '../../store';
import NodeForm from '../NodeForm';
import NodePanels from '../NodePanels';
import { type Direction } from '../ProtocolScreen';
import QuickNodeForm from '../QuickNodeForm';
import { type StageProps } from '../Stage';
import { usePassphrase } from './Anonymisation/usePassphrase';
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

  const subject = stage.subject as Extract<
    StageSubject,
    { entity: 'node' | 'edge' }
  >; // TODO: shouldn't need node | edge

  let quickAdd: string | null = null;
  let form: Form | null = null;

  if (type === 'NameGeneratorQuickAdd') {
    quickAdd = stage.quickAdd;
  }

  if (type === 'NameGenerator') {
    form = stage.form;
  }

  const interfaceRef = useRef(null);

  const { prompt, isLastPrompt, promptIndex } = usePrompts();
  const { requirePassphrase, passphrase } = usePassphrase();

  const [selectedNode, setSelectedNode] = useState<NcNode | null>(null);
  const [showMinWarning, setShowMinWarning] = useState(false);

  const minNodes = minNodesWithDefault(behaviours?.minNodes) as number;
  const maxNodes = maxNodesWithDefault(behaviours?.maxNodes) as number;

  const stageNodeCount = usePropSelector(getStageNodeCount, props); // 1
  const newNodeAttributes = usePropSelector(getAdditionalAttributesSelector, {
    prompt,
    ...props,
  }); // 2

  const nodesForPrompt = usePropSelector(getNetworkNodesForPrompt, props); // 4
  const nodeIconName = useSelector(getNodeIconName);
  const nodeType = useSelector(getNodeTypeLabel(subject.type));
  const nodeColor = useSelector(getNodeColor(subject.type));

  const useEncryption = useSelector(getShouldEncryptNames);

  const dispatch = useDispatch();
  const appDispatch = useAppDispatch();

  useEffect(() => {
    if (useEncryption) {
      requirePassphrase();
    }
  }, [useEncryption, requirePassphrase]);

  const addNode = useCallback(
    (attributes: NcNode[EntityAttributesProperty]) =>
      appDispatch(
        addNodeAction({
          type: subject.type,
          attributeData: attributes,
        }),
      ),
    [appDispatch, subject],
  );

  const updateNode = useCallback(
    (payload: {
      nodeId: NcNode[EntityPrimaryKey];
      newModelData?: Record<string, unknown>;
      newAttributeData: NcNode[EntityAttributesProperty];
    }) => dispatch(updateNodeAction(payload)),
    [dispatch],
  );

  const addNodeToPrompt = useCallback(
    (
      nodeId: NcNode[EntityPrimaryKey],
      promptAttributes: Record<string, boolean> = {},
    ) =>
      appDispatch(
        addNodeToPromptAction({
          nodeId,
          promptAttributes,
        }),
      ),
    [appDispatch],
  );

  const deleteNode = useCallback(
    (uid: NcNode[EntityPrimaryKey]) => {
      dispatch(deleteNodeAction(uid));
    },
    [dispatch],
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
  const handleSelectNode = (node: NcNode) => {
    if (!form) {
      return;
    }
    setSelectedNode(node);
  };

  return (
    <div className="name-generator-interface" ref={interfaceRef}>
      <div className="name-generator-interface__prompt">
        <Prompts />
      </div>
      <div className="name-generator-interface__main">
        <div className="name-generator-interface__panels">
          <NodePanels
            stage={stage}
            prompt={prompt}
            disableAddNew={maxNodesReached}
          />
        </div>
        <div className="name-generator-interface__nodes">
          <NodeList
            items={nodesForPrompt}
            stage={stage}
            listId={`${stage.id}_${promptIndex}_MAIN_NODE_LIST`}
            id="MAIN_NODE_LIST"
            accepts={({ meta }: { meta: NcNode }) =>
              get(meta, 'itemType', null) === 'EXISTING_NODE'
            }
            itemType="EXISTING_NODE"
            onDrop={handleDropNode}
            onItemClick={handleSelectNode}
          />
        </div>
      </div>
      <NodeBin
        accepts={(meta: { itemType: string }) =>
          meta.itemType === 'EXISTING_NODE'
        }
        dropHandler={(meta: NcNode) =>
          deleteNode(meta[entityPrimaryKeyProperty])
        }
        id="NODE_BIN"
      />
      {createPortal(
        <MaxNodesMet show={maxNodesReached} timeoutDuration={0} />,
        document.getElementById('stage')!,
      )}
      {createPortal(
        <MinNodesNotMet
          show={showMinWarning}
          minNodes={minNodes}
          onHideCallback={() => setShowMinWarning(false)}
        />,
        document.getElementById('stage')!,
      )}
      {form && (
        <NodeForm
          subject={subject}
          selectedNode={selectedNode}
          form={form}
          disabled={maxNodesReached || (useEncryption && !passphrase)}
          icon={nodeIconName}
          nodeType={nodeType}
          newNodeAttributes={newNodeAttributes}
          onClose={() => setSelectedNode(null)}
          addNode={addNode}
          updateNode={updateNode}
        />
      )}
      {!form && (
        <QuickNodeForm
          disabled={maxNodesReached}
          icon={nodeIconName}
          nodeColor={nodeColor}
          nodeType={nodeType}
          newNodeAttributes={newNodeAttributes}
          targetVariable={quickAdd}
          onShowForm={() => setShowMinWarning(false)}
          addNode={addNode}
        />
      )}
    </div>
  );
};

export default withNoSSRWrapper(NameGenerator);
