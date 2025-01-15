import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  NcNode,
} from '@codaco/shared-consts';
import { omit } from 'es-toolkit';
import { has } from 'es-toolkit/compat';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import NodeBin from '~/lib/interviewer/components/NodeBin';
import NodeList from '~/lib/interviewer/components/NodeList';
import { usePrompts } from '../../behaviours/withPrompt';
import Prompts from '../../components/Prompts';
import { actionCreators as sessionActions } from '../../ducks/modules/session';
import usePropSelector from '../../hooks/usePropSelector';
import {
  getNetworkNodesForPrompt,
  getStageNodeCount,
} from '../../selectors/interface';
import {
  getNodeIconName,
  getPromptModelData as getPromptNodeModelData,
} from '../../selectors/name-generator';
import { getNodeColor, getNodeTypeLabel } from '../../selectors/network';
import { getAdditionalAttributesSelector } from '../../selectors/prop';
import NodeForm from '../NodeForm';
import { type directions } from '../ProtocolScreen';
import QuickNodeForm from '../QuickNodeForm';
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
    setShowMinWarning: (value: boolean) => void,
  ) =>
  (direction: directions) => {
    if (isLastPrompt && direction === 'forwards' && stageNodeCount < minNodes) {
      setShowMinWarning(true);
      return false;
    }

    return true;
  };

type NameGeneratorProps = {
  registerBeforeNext: (callback: (direction: directions) => boolean) => void;
  stage: {
    id: string;
    form: boolean;
    quickAdd: boolean;
    behaviours: {
      minNodes: number;
      maxNodes: number;
    };
    subject: {
      type: string;
    };
  };
};

const NameGenerator = (props: NameGeneratorProps) => {
  const { registerBeforeNext, stage } = props;

  const { form, quickAdd, behaviours, subject } = stage;

  const interfaceRef = useRef(null);

  const { prompt, isLastPrompt, promptIndex } = usePrompts();

  const [selectedNode, setSelectedNode] = useState(null);
  const [showMinWarning, setShowMinWarning] = useState(false);

  const minNodes = minNodesWithDefault(behaviours?.minNodes) as number;
  const maxNodes = maxNodesWithDefault(behaviours?.maxNodes) as number;

  const stageNodeCount = usePropSelector(getStageNodeCount, props) as number; // 1
  const newNodeAttributes = usePropSelector(getAdditionalAttributesSelector, {
    prompt,
    ...props,
  }) as Record<string, unknown>; // 2
  const newNodeModelData = usePropSelector(
    getPromptNodeModelData,
    props,
  ) as Record<string, unknown>; // 3
  const nodesForPrompt = usePropSelector(
    getNetworkNodesForPrompt,
    props,
  ) as NcNode[]; // 4
  const nodeIconName = usePropSelector(getNodeIconName, props) as string;
  const nodeType = useSelector(getNodeTypeLabel(subject?.type));
  const nodeColor = useSelector(getNodeColor(subject?.type));

  const dispatch = useDispatch();

  const addNode = (...properties) =>
    dispatch(sessionActions.addNode(...properties));
  const addNodeToPrompt = (...properties) =>
    dispatch(sessionActions.addNodeToPrompt(...properties));

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
   * @param {object} item - key/value object containing node object from the network store
   */
  const handleDropNode = (item) => {
    const node = { ...item.meta };
    // Test if we are updating an existing network node, or adding it to the network
    if (has(node, 'promptIDs')) {
      addNodeToPrompt(node[entityPrimaryKeyProperty], prompt.id, {
        ...newNodeAttributes,
      });
    } else {
      const droppedAttributeData = node[entityAttributesProperty];
      const droppedModelData = omit(node, entityAttributesProperty);

      debugger;
      // addNode(
      //   { ...newNodeModelData, ...droppedModelData },
      //   { ...droppedAttributeData, ...newNodeAttributes },
      // );
    }
  };

  // When a node is tapped, trigger editing.
  const handleSelectNode = (node) => {
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
      <div className="relative flex h-full">
        {/* <NodePanels disableAddNew={maxNodesReached} /> */}
        <NodeList
          listId={`${stage.id}_${promptIndex}`}
          items={nodesForPrompt}
          ItemComponent={Node}
          onDrop={handleDropNode}
          allowDrop={!maxNodesReached} // allow dropping of items
          // items accepted here have these meta types
          willAccept={(item) =>
            ['EXISTING_NODE', 'ROSTER_NODE'].includes(item.type)
          }
        />
      </div>
      <NodeBin
        accepts={(meta) => meta.itemType === 'EXISTING_NODE'}
        dropHandler={(meta) => removeNode(meta[entityPrimaryKeyProperty])}
        id="NODE_BIN"
      />
      {createPortal(
        <MaxNodesMet show={maxNodesReached} timeoutDuration={0} />,
        document.getElementById('stage'),
      )}
      {createPortal(
        <MinNodesNotMet
          show={showMinWarning}
          minNodes={minNodes}
          onHideCallback={() => setShowMinWarning(false)}
        />,
        document.getElementById('stage'),
      )}
      {form && (
        <NodeForm
          subject={subject}
          selectedNode={selectedNode}
          form={form}
          disabled={maxNodesReached}
          icon={nodeIconName}
          nodeType={nodeType}
          newNodeModelData={newNodeModelData}
          newNodeAttributes={newNodeAttributes}
          onClose={() => setSelectedNode(null)}
        />
      )}
      {!form && (
        <QuickNodeForm
          target={interfaceRef.current}
          disabled={maxNodesReached}
          icon={nodeIconName}
          nodeColor={nodeColor}
          nodeType={nodeType}
          newNodeModelData={newNodeModelData}
          newNodeAttributes={newNodeAttributes}
          targetVariable={quickAdd}
          onShowForm={() => setShowMinWarning(false)}
        />
      )}
    </div>
  );
};

export default NameGenerator;
