import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import UINode from '~/components/Node';
import NodeList from '~/lib/interviewer/components/NodeList';
import Panel from '~/lib/interviewer/components/Panel';
import Prompts from '~/lib/interviewer/components/Prompts';
import { usePrompts } from '~/lib/interviewer/components/Prompts/usePrompts';
import { addNode, deleteNode } from '~/lib/interviewer/ducks/modules/session';
import { getAdditionalAttributesSelector } from '~/lib/interviewer/selectors/prop';
import { getCodebookVariablesForSubjectType } from '~/lib/interviewer/selectors/protocol';
import {
  getNetworkNodesForPrompt,
  getNodeColorSelector,
  getStageNodeCount,
} from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import getParentKeyByNameValue from '~/lib/interviewer/utils/getParentKeyByNameValue';
import { cx } from '~/utils/cva';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import SearchableList from '../../components/SearchableList';
import { usePassphrase } from '../Anonymisation/usePassphrase';
import { nameGeneratorHandleBeforeLeaving } from '../NameGenerator/NameGenerator';
import {
  MaxNodesMet,
  maxNodesWithDefault,
  MinNodesNotMet,
  minNodesWithDefault,
} from '../utils/StageLevelValidation';
import { type NameGeneratorRosterProps } from './helpers';
import useItems, { type UseItemElement } from './useItems';

function DataCard(props: { item: UseItemElement }) {
  const { item } = props;
  const label = item.data[entityAttributesProperty]?.name || item.id;

  return (
    <div className="card">
      <div className="card-body">
        <p>{label}</p>
      </div>
    </div>
  );
}

const countColumns = (width: number) =>
  width < 140 ? 1 : Math.floor(width / 450);

const ErrorMessage = (props: { error: Error }) => (
  <div className="flex flex-1 flex-col items-center justify-center">
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

  const dropNodeColor = useSelector(getNodeColorSelector);

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

  const handleAddNode = (metadata?: Record<string, unknown>) => {
    const meta = metadata as UseItemElement | undefined;
    if (!meta) return;

    const { id, data } = meta;
    const attributeData = {
      ...newNodeAttributes,
      ...data[entityAttributesProperty],
    };

    void dispatch(
      addNode({
        type: stage.subject.type,
        modelData: {
          [entityPrimaryKeyProperty]: id,
        },
        attributeData,
        useEncryption,
        // External roster data may contain attributes not in the codebook
        allowUnknownAttributes: true,
      }),
    );
  };

  const handleRemoveNode = useCallback(
    ({ meta: { _uid } }: { meta: { _uid: string } }) => {
      dispatch(deleteNode(_uid));
    },
    [dispatch],
  );

  const nodeListClasses = cx('relative flex flex-1');

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
    <div
      className="flex h-full flex-1 flex-col items-center justify-center overflow-hidden"
      ref={interfaceRef}
    >
      <div
        className="flex flex-[0_0_var(--interface-prompt-flex-basis)] items-center justify-center text-center"
        key="prompts"
      >
        <Prompts />
      </div>
      <div className="flex size-full grow">
        <motion.div
          className="flex flex-1"
          key="panels"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={variants}
          style={{ transitionDuration: '--animation-duration-standard' }}
        >
          <div className="flex h-full min-w-[30rem] flex-1 pr-[1.8rem] [&_.card]:cursor-grab">
            <SearchableList
              key={String(disabled)}
              loading={itemsStatus.isLoading}
              items={items}
              title="Available to add"
              columns={countColumns}
              placeholder={
                itemsStatus.error && <ErrorMessage error={itemsStatus.error} />
              }
              itemType="SOURCE_NODES"
              excludeItems={excludeItems}
              itemComponent={DataCard}
              dragComponent={DragPreviewNode}
              accepts={['ADDED_NODES']}
              onDrop={handleRemoveNode}
              dropNodeColor={dropNodeColor}
              disabled={disabled}
            />
          </div>
          <div className="flex h-full flex-1 flex-col [&_.node-list]:flex-1 [&_.node-list.node-list--drag]:bg-transparent [&_.node-list.node-list--hover]:bg-transparent">
            <Panel title="Added" noCollapse>
              <div className={nodeListClasses}>
                <NodeList
                  id="node-list"
                  className={nodeListClasses}
                  itemType="ADDED_NODES"
                  accepts={['ADDED_NODES']}
                  onDrop={handleAddNode}
                  items={nodesForPrompt}
                  virtualized
                />
              </div>
            </Panel>
          </div>
        </motion.div>
      </div>
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
