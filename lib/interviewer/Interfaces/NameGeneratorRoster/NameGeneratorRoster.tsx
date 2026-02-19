import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import UINode from '~/components/Node';
import NodeList from '~/lib/interviewer/components/NodeList';
import Panel from '~/lib/interviewer/components/Panel';
import Prompts from '~/lib/interviewer/components/Prompts';
import { usePrompts } from '~/lib/interviewer/components/Prompts/usePrompts';
import { addNode, deleteNode } from '~/lib/interviewer/ducks/modules/session';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import useStageValidation from '~/lib/interviewer/hooks/useStageValidation';
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
import SearchableList from '../../components/SearchableList';
import { usePassphrase } from '../Anonymisation/usePassphrase';
import { type NameGeneratorRosterProps } from './helpers';
import useItems, { type UseItemElement } from './useItems';

function DataCard(props: UseItemElement['props']) {
  const { label } = props;

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

  const { isLastPrompt } = usePrompts();

  const { requirePassphrase, passphrase } = usePassphrase();

  const interfaceRef = useRef(null);

  const dispatch = useAppDispatch();

  const newNodeAttributes = useSelector(getAdditionalAttributesSelector);
  const codebookForNodeType = useSelector(getCodebookVariablesForSubjectType);
  const nodesForPrompt = useSelector(getNetworkNodesForPrompt);

  const dropNodeColor = useSelector(getNodeColorSelector);

  const { status: itemsStatus, items, excludeItems } = useItems(props);

  const stageNodeCount = useSelector(getStageNodeCount);
  const minNodes = stage.behaviours?.minNodes ?? 0;
  const maxNodes = stage.behaviours?.maxNodes ?? Infinity;

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

    if (maxNodesReached) {
      return true;
    }

    return false;
  }, [maxNodesReached, itemsStatus, passphrase, useEncryption]);

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
    </div>
  );
};

export default NameGeneratorRoster;
