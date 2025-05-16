import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import cx from 'classnames';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { usePrompts } from '~/lib/interviewer/behaviours/withPrompt';
import Node from '~/lib/interviewer/components/Node';
import NodeList from '~/lib/interviewer/components/NodeList';
import Panel from '~/lib/interviewer/components/Panel';
import Prompts from '~/lib/interviewer/components/Prompts';
import { addNode, deleteNode } from '~/lib/interviewer/ducks/modules/session';
import { getAdditionalAttributesSelector } from '~/lib/interviewer/selectors/prop';
import { getCodebookVariablesForSubjectType } from '~/lib/interviewer/selectors/protocol';
import {
  getNetworkNodesForPrompt,
  getNodeColor,
  getStageNodeCount,
} from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import getParentKeyByNameValue from '~/lib/interviewer/utils/getParentKeyByNameValue';
import { DataCard } from '~/lib/ui/components/Cards';
import UINode from '~/lib/ui/components/Node';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import SearchableList from '../../SearchableList';
import { usePassphrase } from '../Anonymisation/usePassphrase';
import { nameGeneratorHandleBeforeLeaving } from '../NameGenerator';
import {
  MaxNodesMet,
  maxNodesWithDefault,
  MinNodesNotMet,
  minNodesWithDefault,
} from '../utils/StageLevelValidation';
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

const variants = {
  visible: {
    opacity: 1,
  },
  hidden: { opacity: 0 },
};

/**
 * Name Generator (unified) Roster Interface
 */
const NameGeneratorRoster = (props: NameGeneratorRosterProps) => {
  const { stage, registerBeforeNext } = props;

  const { promptIndex, isLastPrompt } = usePrompts();

  const { requirePassphrase, passphrase } = usePassphrase();

  const interfaceRef = useRef(null);

  const dispatch = useAppDispatch();

  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);
  const codebookForNodeType = useSelector(getCodebookVariablesForSubjectType);
  const nodesForPrompt = useSelector(getNetworkNodesForPrompt);

  const nodeType = stage.subject.type;
  const dropNodeColor = useSelector(getNodeColor(nodeType));

  const { status: itemsStatus, items, excludeItems } = useItems(props);

  const stageNodeCount = useSelector(getStageNodeCount);
  const minNodes = minNodesWithDefault(stage.behaviours?.minNodes);
  const maxNodes = maxNodesWithDefault(stage.behaviours?.maxNodes);

  const [showMinWarning, setShowMinWarning] = useState(false);

  const useEncryption = useMemo(() => {
    // Handle new node attributes, first since it is simpler
    if (
      Object.keys(newNodeAttributes).some(
        (variableId) => codebookForNodeType[variableId]?.encrypted,
      )
    ) {
      return true;
    }

    // To set this, we need to work out if adding a node based on the items
    // will require encryption. This will be the case if any of the external
    // data item keys match with the name property of any codebook variables
    // for the node type (meaning that they will be transposed to the when
    // the node is added to the interview
    const itemAttributesWithCodebookMatches = items.reduce(
      (codebookMatches, item) => {
        const attributesWithCodebookMatches = Object.keys(
          item.data[entityAttributesProperty],
        ).reduce((acc, attribute) => {
          const codebookKey = getParentKeyByNameValue(
            codebookForNodeType,
            attribute,
          );

          if (codebookKey) {
            return [...acc, codebookKey];
          }

          return acc;
        }, [] as string[]);

        // Only add the codebook matches if they are not already in the list;
        return [
          ...codebookMatches,
          ...attributesWithCodebookMatches.filter(
            (codebookMatch) => !codebookMatches.includes(codebookMatch),
          ),
        ];
      },
      [] as string[],
    );

    return itemAttributesWithCodebookMatches.some(
      (itemAttribute) => codebookForNodeType[itemAttribute]?.encrypted,
    );
  }, [items, codebookForNodeType, newNodeAttributes]);

  useEffect(() => {
    if (useEncryption) {
      requirePassphrase();
    }
  }, [useEncryption, requirePassphrase]);

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

  const handleAddNode = ({ meta }: { meta: UseItemElement }) => {
    const { id, data } = meta;
    const attributeData = {
      ...newNodeAttributes,
      ...data.attributes,
    };

    void dispatch(
      addNode({
        type: stage.subject.type,
        modelData: {
          [entityPrimaryKeyProperty]: id,
        },
        attributeData,
        useEncryption,
      }),
    );
  };

  const handleRemoveNode = useCallback(
    ({ meta: { _uid } }: { meta: { _uid: string } }) => {
      dispatch(deleteNode(_uid));
    },
    [dispatch],
  );

  const nodeListClasses = cx('name-generator-roster-interface__node-list', {
    'name-generator-roster-interface__node-list--empty':
      nodesForPrompt.length === 0,
  });

  const disabled = useMemo(() => {
    if (!passphrase && useEncryption) {
      return true;
    }
    if (itemsStatus.isLoading) {
      return true;
    }

    if (stageNodeCount >= maxNodes) {
      return true;
    }

    return false;
  }, [stageNodeCount, maxNodes, itemsStatus, passphrase, useEncryption]);

  const DragPreviewNode = useMemo(
    () =>
      // eslint-disable-next-line react/display-name
      ({
        props,
      }: {
        props: {
          label: string;
        };
      }) => <UINode color={dropNodeColor} label={props.label} />,
    [dropNodeColor],
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
            dragComponent={DragPreviewNode}
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
              <NodeList
                id="node-list"
                className={nodeListClasses}
                itemType="ADDED_NODES"
                accepts={({
                  meta: { itemType },
                }: {
                  meta: { itemType: string };
                }) => itemType !== 'ADDED_NODES'}
                onDrop={handleAddNode}
                items={nodesForPrompt}
                itemComponent={Node}
              />
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
