import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import cx from 'classnames';
import { get, isEmpty } from 'lodash-es';
import { AnimatePresence, motion } from 'motion/react';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useDropMonitor from '~/lib/interviewer/behaviours/DragAndDrop/useDropMonitor';
import { usePrompts } from '~/lib/interviewer/behaviours/withPrompt';
import List from '~/lib/interviewer/components/List';
import Node from '~/lib/interviewer/components/Node';
import Panel from '~/lib/interviewer/components/Panel';
import Prompts from '~/lib/interviewer/components/Prompts';
import { actionCreators as sessionActions } from '~/lib/interviewer/ducks/modules/session';
import useAnimationSettings from '~/lib/interviewer/hooks/useAnimationSettings';
import usePropSelector from '~/lib/interviewer/hooks/usePropSelector';
import {
  getNetworkNodesForPrompt,
  getNodeVariables,
  makeGetStageNodeCount,
} from '~/lib/interviewer/selectors/interface';
import { getPromptModelData } from '~/lib/interviewer/selectors/name-generator';
import { getNodeColor } from '~/lib/interviewer/selectors/network';
import { getAdditionalAttributesSelector } from '~/lib/interviewer/selectors/prop';
import { DataCard } from '~/lib/ui/components/Cards';
import SearchableList from '../../SearchableList';
import { nameGeneratorHandleBeforeLeaving } from '../NameGenerator';
import {
  MaxNodesMet,
  maxNodesWithDefault,
  MinNodesNotMet,
  minNodesWithDefault,
} from '../utils/StageLevelValidation';
import DropOverlay from './DropOverlay';
import { convertNamesToUUIDs } from './helpers';
import useFuseOptions from './useFuseOptions';
import useItems from './useItems';
import useSortableProperties from './useSortableProperties';

const countColumns = (width) => (width < 140 ? 1 : Math.floor(width / 450));

const ErrorMessage = ({ error }) => (
  <div
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <h1>Something went wrong</h1>
    <p>External data could not be loaded.</p>
    <p>
      <small>{error.toString()}</small>
    </p>
  </div>
);

/**
 * Name Generator (unified) Roster Interface
 */
const NameGeneratorRoster = (props) => {
  const { stage, registerBeforeNext } = props;

  const { promptIndex, isLastPrompt } = usePrompts();

  const interfaceRef = useRef(null);

  const dispatch = useDispatch();
  const { duration } = useAnimationSettings();

  const newNodeAttributes = usePropSelector(
    getAdditionalAttributesSelector,
    props,
  );

  const newNodeModelData = usePropSelector(getPromptModelData, props);
  const nodesForPrompt = usePropSelector(getNetworkNodesForPrompt, props);
  const nodeVariables = usePropSelector(getNodeVariables, props);
  const nodeType = stage && stage.subject && stage.subject.type;
  const dropNodeColor = useSelector(getNodeColor(nodeType));

  const [itemsStatus, items, excludeItems] = useItems(props);

  const sortOptions = useSortableProperties(nodeVariables, stage.sortOptions);

  const stageNodeCount = usePropSelector(makeGetStageNodeCount, props, true);
  const minNodes = minNodesWithDefault(
    get(props, ['stage', 'behaviours', 'minNodes']),
  );
  const maxNodes = maxNodesWithDefault(
    get(props, ['stage', 'behaviours', 'maxNodes']),
  );

  const [showMinWarning, setShowMinWarning] = useState(false);

  registerBeforeNext(
    nameGeneratorHandleBeforeLeaving(
      isLastPrompt,
      stageNodeCount,
      minNodes,
      setShowMinWarning,
    ),
  );

  useEffect(() => {
    setShowMinWarning(false);
  }, [stageNodeCount, promptIndex]);

  const searchOptions = ((options) => {
    if (!options || isEmpty(options)) {
      return options;
    }

    return {
      ...options,
      matchProperties: convertNamesToUUIDs(
        nodeVariables,
        get(stage, 'searchOptions.matchProperties'),
      ),
    };
  })(stage.searchOptions);

  const fallbackKeys = useMemo(
    () =>
      Object.keys(get(items, [0, 'data', entityAttributesProperty], {})).map(
        (attribute) => ['data', entityAttributesProperty, attribute],
      ),
    [items],
  );

  const fuseOptions = useFuseOptions(searchOptions, {
    keys: fallbackKeys,
    threshold: 0.6,
  });

  const { isOver, willAccept } = useDropMonitor('node-list') || {
    isOver: false,
    willAccept: false,
  };

  const addNode = useCallback(
    (...properties) => dispatch(sessionActions.addNode(...properties)),
    [dispatch],
  );

  const handleAddNode = ({ meta }) => {
    const { id, data } = meta;
    const attributeData = {
      ...newNodeAttributes,
      ...data.attributes,
    };

    const modelData = {
      ...newNodeModelData,
      [entityPrimaryKeyProperty]: id,
    };

    addNode(modelData, attributeData);
  };

  const handleRemoveNode = ({ meta: { id } }) => {
    dispatch(sessionActions.removeNode(id));
  };

  const variants = {
    visible: {
      opacity: 1,
      transition: { duration: duration.standard },
    },
    hidden: { opacity: 0, transition: { duration: duration.standard } },
  };

  const nodeListClasses = cx('name-generator-roster-interface__node-list', {
    'name-generator-roster-interface__node-list--empty':
      nodesForPrompt.length === 0,
  });

  const disabled = useMemo(
    () => itemsStatus.isLoading || stageNodeCount >= maxNodes,
    [stageNodeCount, maxNodes, itemsStatus.isLoading],
  );

  return (
    <div className="name-generator-roster-interface" ref={interfaceRef}>
      <div className="name-generator-roster-interface__prompt" key="prompts">
        <Prompts />
      </div>
      <motion.div
        className="name-generator-roster-interface__panels"
        key="panels"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={variants}
      >
        <div className="name-generator-roster-interface__search-panel">
          <SearchableList
            key={disabled}
            loading={itemsStatus.isLoading}
            id="searchable-list"
            items={items}
            title="Available to add"
            columns={countColumns}
            placeholder={
              itemsStatus.error && <ErrorMessage error={itemsStatus.error} />
            }
            itemType="SOURCE_NODES" // drop type
            excludeItems={excludeItems}
            itemComponent={DataCard}
            dragComponent={Node}
            sortOptions={sortOptions}
            searchOptions={fuseOptions}
            accepts={({ meta: { itemType } }) => itemType !== 'SOURCE_NODES'}
            onDrop={handleRemoveNode}
            dropNodeColor={dropNodeColor}
            disabled={disabled}
          />
        </div>
        <div className="name-generator-roster-interface__node-panel">
          <Panel title="Added" noHighlight noCollapse>
            <div className="name-generator-roster-interface__node-list">
              <List
                id="node-list"
                className={nodeListClasses}
                itemType="ADDED_NODES"
                accepts={({ meta: { itemType } }) => itemType !== 'ADDED_NODES'}
                onDrop={handleAddNode}
                items={nodesForPrompt.map((item) => ({
                  id: item._uid,
                  data: item,
                  props: item,
                }))}
                itemComponent={Node}
              />
              <AnimatePresence>
                {willAccept && (
                  <DropOverlay
                    isOver={isOver}
                    nodeColor={dropNodeColor}
                    message="Drop here to add"
                  />
                )}
              </AnimatePresence>
            </div>
          </Panel>
        </div>
      </motion.div>
      {interfaceRef.current && (
        <MinNodesNotMet
          show={showMinWarning}
          minNodes={minNodes}
          onHideCallback={() => setShowMinWarning(false)}
        />
      )}
      {interfaceRef.current && (
        <MaxNodesMet show={stageNodeCount >= maxNodes} timeoutDuration={0} />
      )}
    </div>
  );
};

NameGeneratorRoster.propTypes = {
  stage: PropTypes.object.isRequired,
};

export default NameGeneratorRoster;
