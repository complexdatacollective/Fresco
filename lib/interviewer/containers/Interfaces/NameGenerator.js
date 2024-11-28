import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { has, omit } from 'lodash-es';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { get } from '../../utils/lodash-replacements';
import NodeForm from '../NodeForm';
import NodePanels from '../NodePanels';
import QuickNodeForm from '../QuickNodeForm';
import {
  MaxNodesMet,
  maxNodesWithDefault,
  MinNodesNotMet,
  minNodesWithDefault,
} from './utils/StageLevelValidation';

export const nameGeneratorHandleBeforeLeaving =
  (isLastPrompt, stageNodeCount, minNodes, setShowMinWarning) =>
  (direction) => {
    if (isLastPrompt && direction === 'forwards' && stageNodeCount < minNodes) {
      setShowMinWarning(true);
      return false;
    }

    return true;
  };

const NameGenerator = (props) => {
  const { registerBeforeNext, stage } = props;

  const { form, quickAdd, behaviours, subject } = stage;

  const interfaceRef = useRef(null);

  const { prompt, isLastPrompt, promptIndex } = usePrompts();

  const [selectedNode, setSelectedNode] = useState(null);
  const [showMinWarning, setShowMinWarning] = useState(false);

  const minNodes = minNodesWithDefault(behaviours?.minNodes);
  const maxNodes = maxNodesWithDefault(behaviours?.maxNodes);

  const stageNodeCount = usePropSelector(getStageNodeCount, props); // 1
  const newNodeAttributes = usePropSelector(getAdditionalAttributesSelector, {
    prompt,
    ...props,
  }); // 2
  const newNodeModelData = usePropSelector(getPromptNodeModelData, props); // 3
  const nodesForPrompt = usePropSelector(getNetworkNodesForPrompt, props); // 4
  const nodeIconName = usePropSelector(getNodeIconName, props);
  const nodeType = useSelector(getNodeTypeLabel(subject?.type));
  const nodeColor = useSelector(getNodeColor(subject?.type));

  const dispatch = useDispatch();

  const addNode = useCallback(
    (...properties) => dispatch(sessionActions.addNode(...properties)),
    [dispatch],
  );

  const addNodeToPrompt = (...properties) =>
    dispatch(sessionActions.addNodeToPrompt(...properties));
  const removeNode = (uid) => {
    dispatch(sessionActions.removeNode(uid));
  };

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

      addNode(
        { ...newNodeModelData, ...droppedModelData },
        { ...droppedAttributeData, ...newNodeAttributes },
      );
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
            accepts={({ meta }) => get(meta, 'itemType', null) === 'NEW_NODE'}
            itemType="EXISTING_NODE"
            onDrop={handleDropNode}
            onItemClick={handleSelectNode}
          />
        </div>
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

NameGenerator.propTypes = {
  stage: PropTypes.object.isRequired,
};
