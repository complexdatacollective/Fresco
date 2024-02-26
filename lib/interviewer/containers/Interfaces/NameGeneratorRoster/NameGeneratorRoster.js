import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { motion, AnimatePresence } from 'framer-motion';
import { isEmpty } from 'lodash';
import { DataCard } from '~/lib/ui/components/Cards';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import Prompts from '../../../components/Prompts';
import { usePrompts } from '../../../behaviours/withPrompt';
import {
  makeGetStageNodeCount,
  getNetworkNodesForPrompt,
  getNodeVariables,
} from '../../../selectors/interface';
import { getPromptModelData } from '../../../selectors/name-generator';
import { actionCreators as sessionActions } from '../../../ducks/modules/session';
import { getNodeColor } from '../../../selectors/network';
import List from '../../../components/List';
import Panel from '../../../components/Panel';
import Loading from '../../../components/Loading';
import useAnimationSettings from '../../../hooks/useAnimationSettings';
import useDropMonitor from '../../../behaviours/DragAndDrop/useDropMonitor';
import Node from '../../../components/Node';
import SearchableList from '../../SearchableList';
import usePropSelector from '../../../hooks/usePropSelector';
import useFuseOptions from './useFuseOptions';
import useSortableProperties from './useSortableProperties';
import useItems from './useItems';
import { convertNamesToUUIDs } from './helpers';
import DropOverlay from './DropOverlay';
import {
  MaxNodesMet,
  maxNodesWithDefault,
  MinNodesNotMet,
  minNodesWithDefault,
} from '../utils/StageLevelValidation';
import { get } from '../../../utils/lodash-replacements';
import { getAdditionalAttributesSelector } from '~/lib/interviewer/selectors/prop';
import { nameGeneratorHandleBeforeLeaving } from '../NameGenerator';

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
  const {
    stage,
    registerBeforeNext,
  } = props;

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

  registerBeforeNext(nameGeneratorHandleBeforeLeaving(isLastPrompt, stageNodeCount, minNodes, setShowMinWarning));

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

    dispatch(sessionActions.addNode(modelData, attributeData));
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
    () => itemsStatus.isLoading || (stageNodeCount >= maxNodes),
    [stageNodeCount, maxNodes, itemsStatus.isLoading],
  );

  return (
    <div className="name-generator-roster-interface" ref={interfaceRef}>

      <div
        className="name-generator-roster-interface__prompt"
        key="prompts"
      >
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
              itemsStatus.error && (
                <ErrorMessage error={itemsStatus.error} />
              )
            }
            itemType="SOURCE_NODES" // drop type
            excludeItems={excludeItems}
            itemComponent={DataCard}
            dragComponent={Node}
            sortOptions={sortOptions}
            searchOptions={fuseOptions}
            accepts={({ meta: { itemType } }) =>
              itemType !== 'SOURCE_NODES'
            }
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
                accepts={({ meta: { itemType } }) =>
                  itemType !== 'ADDED_NODES'
                }
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
