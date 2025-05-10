import {
  type EntityAttributesProperty,
  type EntityPrimaryKey,
  entityPrimaryKeyProperty,
  type NcEntity,
} from '@codaco/shared-consts';
import cx from 'classnames';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import useDropMonitor from '~/lib/interviewer/behaviours/DragAndDrop/useDropMonitor';
import { usePrompts } from '~/lib/interviewer/behaviours/withPrompt';
import List from '~/lib/interviewer/components/List';
import Node from '~/lib/interviewer/components/Node';
import Panel from '~/lib/interviewer/components/Panel';
import Prompts from '~/lib/interviewer/components/Prompts';
import { addNode, deleteNode } from '~/lib/interviewer/ducks/modules/session';
import { getPromptModelData } from '~/lib/interviewer/selectors/name-generator';
import { getAdditionalAttributesSelector } from '~/lib/interviewer/selectors/prop';
import {
  getNetworkNodesForPrompt,
  getNodeColor,
  getStageNodeCount,
} from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import { DataCard } from '~/lib/ui/components/Cards';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import SearchableList from '../../SearchableList';
import { nameGeneratorHandleBeforeLeaving } from '../NameGenerator';
import {
  MaxNodesMet,
  maxNodesWithDefault,
  MinNodesNotMet,
  minNodesWithDefault,
} from '../utils/StageLevelValidation';
import DropOverlay from './DropOverlay';
import { type NameGeneratorRosterProps } from './helpers';
import useItems, { type UseItemElement } from './useItems';

const countColumns = (width: number) =>
  width < 140 ? 1 : Math.floor(width / 450);

const ErrorMessage = (props: { error: Error }) => (
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
      <small>{props.error.message}</small>
    </p>
  </div>
);

/**
 * Name Generator (unified) Roster Interface
 */
const NameGeneratorRoster = (props: NameGeneratorRosterProps) => {
  const { stage, registerBeforeNext } = props;

  const { promptIndex, isLastPrompt } = usePrompts();

  const interfaceRef = useRef(null);

  const dispatch = useAppDispatch();

  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);

  const newNodeModelData = useSelector(getPromptModelData);
  const nodesForPrompt = useSelector(getNetworkNodesForPrompt);

  const nodeType = stage.subject.type;
  const dropNodeColor = useSelector(getNodeColor(nodeType));

  const { status: itemsStatus, items, excludeItems } = useItems(props);

  const stageNodeCount = useSelector(getStageNodeCount);
  const minNodes = minNodesWithDefault(stage.behaviours?.minNodes);
  const maxNodes = maxNodesWithDefault(stage.behaviours?.maxNodes);

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

  const { isOver, willAccept } = useDropMonitor('node-list') ?? {
    isOver: false,
    willAccept: false,
  };

  const handleAddNode = ({
    meta,
  }: {
    meta: {
      id: NcEntity[EntityPrimaryKey];
      data: {
        attributes: NcEntity[EntityAttributesProperty];
      };
    };
  }) => {
    const { id, data } = meta;
    const attributeData = {
      ...newNodeAttributes,
      ...data.attributes,
    };

    void dispatch(
      addNode({
        type: newNodeModelData.type,
        modelData: {
          [entityPrimaryKeyProperty]: id,
        },
        attributeData,
      }),
    );
  };

  const handleRemoveNode = ({ meta: { id } }: { meta: UseItemElement }) => {
    dispatch(deleteNode(id));
  };

  const variants = {
    visible: {
      opacity: 1,
    },
    hidden: { opacity: 0 },
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
        style={{ transitionDuration: '--animation-duration-standard' }}
      >
        <div className="name-generator-roster-interface__search-panel">
          <SearchableList
            key={String(disabled)}
            loading={itemsStatus.isLoading}
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
            accepts={({ meta: { itemType } }: { meta: { itemType: string } }) =>
              itemType !== 'SOURCE_NODES'
            }
            onDrop={handleRemoveNode}
            dropNodeColor={dropNodeColor}
            disabled={disabled}
          />
        </div>
        <div className="name-generator-roster-interface__node-panel">
          <Panel title="Added" noCollapse>
            <div className="name-generator-roster-interface__node-list">
              <List
                id="node-list"
                className={nodeListClasses}
                itemType="ADDED_NODES"
                accepts={({
                  meta: { itemType },
                }: {
                  meta: { itemType: string };
                }) => itemType !== 'ADDED_NODES'}
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

export default withNoSSRWrapper(NameGeneratorRoster);
