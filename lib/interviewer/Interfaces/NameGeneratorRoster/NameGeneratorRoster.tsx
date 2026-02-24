import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { AnimatePresence } from 'motion/react';
import { useCallback, useEffect, useId, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import Heading from '~/components/typography/Heading';
import Paragraph from '~/components/typography/Paragraph';
import { ResizableFlexPanel } from '~/components/ui/ResizableFlexPanel';
import { Collection } from '~/lib/collection/components/Collection';
import { CollectionFilterInput } from '~/lib/collection/components/CollectionFilterInput';
import { CollectionSortButton } from '~/lib/collection/components/CollectionSortButton';
import { useDragAndDrop } from '~/lib/collection/dnd/useDragAndDrop';
import { ListLayout } from '~/lib/collection/layout/ListLayout';
import {
  type SortType as CollectionSortType,
  type SortableProperty,
  type SortRule,
} from '~/lib/collection/sorting/types';
import { type ItemProps } from '~/lib/collection/types';
import { useDndStore, type DndStore } from '~/lib/dnd';
import Loading from '~/lib/interviewer/components/Loading';
import NodeList from '~/lib/interviewer/components/NodeList';
import Panel from '~/lib/interviewer/components/Panel';
import Prompts from '~/lib/interviewer/components/Prompts';
import { usePrompts } from '~/lib/interviewer/components/Prompts/usePrompts';
import { addNode, deleteNode } from '~/lib/interviewer/ducks/modules/session';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import useStageValidation from '~/lib/interviewer/hooks/useStageValidation';
import { getNodeVariables } from '~/lib/interviewer/selectors/interface';
import {
  getSearchOptions,
  getSortOptions,
} from '~/lib/interviewer/selectors/name-generator';
import { getAdditionalAttributesSelector } from '~/lib/interviewer/selectors/prop';
import { getCodebookVariablesForSubjectType } from '~/lib/interviewer/selectors/protocol';
import {
  getNetworkNodesForPrompt,
  getNodeColorSelector,
  getStageNodeCount,
} from '~/lib/interviewer/selectors/session';
import { useAppDispatch } from '~/lib/interviewer/store';
import { mapNCType } from '~/lib/interviewer/utils/createSorter';
import getParentKeyByNameValue from '~/lib/interviewer/utils/getParentKeyByNameValue';
import { cx } from '~/utils/cva';
import { usePassphrase } from '../Anonymisation/usePassphrase';
import DropOverlay from './DropOverlay';
import { convertNamesToUUIDs, type NameGeneratorRosterProps } from './helpers';
import useItems, { type UseItemElement } from './useItems';

/**
 * Maps Network Canvas variable types (which include 'hierarchy' and
 * 'categorical') to the subset supported by Collection's sort system.
 */
const toCollectionSortType = (
  ncType: ReturnType<typeof mapNCType>,
): CollectionSortType => {
  if (ncType === 'hierarchy' || ncType === 'categorical') return 'string';
  return ncType;
};

const ErrorMessage = (_props: { error: Error }) => (
  <div className="flex flex-1 flex-col items-center justify-center">
    <Heading level="h2">Something went wrong</Heading>
    <Paragraph>External data could not be loaded.</Paragraph>
  </div>
);

const layout = new ListLayout<UseItemElement>({ gap: 14 });

const keyExtractor = (item: UseItemElement) => item.id;

/**
 * Name Generator (unified) Roster Interface
 */
const NameGeneratorRoster = (props: NameGeneratorRosterProps) => {
  const { stage } = props;

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

  // --- Search / filter setup ---
  const searchOptions = useSelector(getSearchOptions);
  const nodeVariables = useSelector(getNodeVariables);

  const filterKeys = useMemo(() => {
    if (!searchOptions) return undefined;
    return convertNamesToUUIDs(
      nodeVariables,
      searchOptions.matchProperties,
    ).map((uuid) => ['data', entityAttributesProperty, uuid]);
  }, [searchOptions, nodeVariables]);

  const filterFuseOptions = useMemo(() => {
    if (!searchOptions) return undefined;
    return {
      threshold: searchOptions.fuzziness,
      ignoreLocation: true,
      minMatchCharLength: 1,
      findAllMatches: true,
      useExtendedSearch: true,
    };
  }, [searchOptions]);

  // --- Sort setup ---
  const sortOptions = useSelector(getSortOptions);

  const { initialSortRules, sortableProperties } = useMemo<{
    initialSortRules: SortRule[] | undefined;
    sortableProperties: SortableProperty[] | undefined;
  }>(() => {
    if (!sortOptions)
      return { initialSortRules: undefined, sortableProperties: undefined };

    const sortOrder = sortOptions.sortOrder ?? [];

    const initialPropertyName = sortOrder[0]?.property
      ? [sortOrder[0].property]
      : ['name'];
    const uuid = convertNamesToUUIDs(nodeVariables, initialPropertyName)[0]!;
    const variableDef = nodeVariables[uuid];
    const ncType = mapNCType(variableDef?.type);

    const rules: SortRule[] = [
      {
        property: ['data', entityAttributesProperty, uuid],
        direction: sortOrder[0]?.direction ?? 'asc',
        type: toCollectionSortType(ncType),
      },
    ];

    const props = sortOptions.sortableProperties?.map(({ variable, label }) => {
      const varUuid = convertNamesToUUIDs(nodeVariables, [variable])[0]!;
      const varDef = nodeVariables[varUuid];
      const varNcType = mapNCType(varDef?.type);

      return {
        property: ['data', entityAttributesProperty, varUuid],
        label,
        type: toCollectionSortType(varNcType),
      };
    });

    return { initialSortRules: rules, sortableProperties: props };
  }, [sortOptions, nodeVariables]);

  // --- Encryption detection ---
  const useEncryption = useMemo(() => {
    if (
      Object.keys(newNodeAttributes).some(
        (variableId) => codebookForNodeType[variableId]?.encrypted,
      )
    ) {
      return true;
    }

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
  const minNodesMet = !minNodes || !isLastPrompt || stageNodeCount >= minNodes;

  const { updateReady } = useReadyForNextStage();
  const { showToast, closeToast } = useStageValidation({
    constraints: [
      {
        direction: 'forwards',
        isMet: minNodesMet,
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
        variant: 'success',
        anchor: 'forward',
        timeout: 0,
      });
    } else if (maxToastRef.current) {
      closeToast(maxToastRef.current);
      maxToastRef.current = null;
    }

    return () => {
      if (maxToastRef.current) {
        closeToast(maxToastRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxNodesReached]);

  useEffect(() => {
    updateReady(minNodesMet || maxNodesReached);
  }, [minNodesMet, maxNodesReached, updateReady]);

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
        allowUnknownAttributes: true,
      }),
    );
  };

  const handleRemoveNode = useCallback(
    (metadata: Record<string, unknown>) => {
      const uid = metadata[entityPrimaryKeyProperty] as string | undefined;
      if (uid) {
        dispatch(deleteNode(uid));
      }
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

  // --- Exclude already-added items from source panel ---
  const filteredItems = useMemo(() => {
    if (!excludeItems || excludeItems.length === 0) return items;
    const excludeSet = new Set(excludeItems);
    return items.filter((item) => !excludeSet.has(item.id));
  }, [items, excludeItems]);

  // --- Disabled keys to prevent dragging when disabled ---
  const disabledKeys = useMemo(
    () => (disabled ? filteredItems.map((item) => item.id) : undefined),
    [disabled, filteredItems],
  );

  // --- DnD setup for source panel ---
  const sourceCollectionId = `source-nodes-${useId()}`;

  const { dragAndDropHooks } = useDragAndDrop<UseItemElement>({
    getItems: (keys) => [{ type: 'SOURCE_NODES', keys }],
    acceptTypes: ['ADDED_NODES'],
    onDrop: (e) => {
      if (e.metadata) handleRemoveNode(e.metadata);
    },
    getItemMetadata: (key) => {
      const item = filteredItems.find((i) => i.id === String(key));
      return item
        ? { ...item, itemType: 'SOURCE_NODES' }
        : { itemType: 'SOURCE_NODES' };
    },
  });

  // --- Drop overlay state ---
  const isDragging = useDndStore((state: DndStore) => state.isDragging);
  const activeDropTargetId = useDndStore(
    (state: DndStore) => state.activeDropTargetId,
  );
  const dragItem = useDndStore((state: DndStore) => state.dragItem);

  const dragItemType = (dragItem?.metadata as { itemType?: string })?.itemType;
  const willAcceptDrop = isDragging && dragItemType === 'ADDED_NODES';
  const isOverSource = activeDropTargetId === `${sourceCollectionId}-container`;

  // --- Render item callback ---
  const renderItem = useCallback(
    (item: UseItemElement, itemProps: ItemProps) => (
      <div {...itemProps}>
        <div className="bg-platinum text-charcoal rounded-sm p-4">
          <Heading level="label">{item.props.label}</Heading>
        </div>
      </div>
    ),
    [],
  );

  return (
    <div
      className="interface flex min-h-0 flex-1 flex-col items-center justify-center"
      ref={interfaceRef}
    >
      <Prompts />
      <ResizableFlexPanel
        storageKey="name-generator-roster-panels"
        defaultBasis={50}
        className="min-h-0 w-full flex-1 basis-full"
        aria-label="Resize panel and node list areas"
      >
        <Panel title="Available to add" panelNumber={0} noCollapse>
          {itemsStatus.isLoading ? (
            <Loading message="Loading..." />
          ) : itemsStatus.error ? (
            <ErrorMessage error={itemsStatus.error} />
          ) : (
            <div className="relative flex min-h-0 flex-1 flex-col [&_.card]:cursor-grab">
              <Collection
                items={filteredItems}
                keyExtractor={keyExtractor}
                textValueExtractor={(item: UseItemElement) => item.props.label}
                layout={layout}
                renderItem={renderItem}
                filterKeys={filterKeys}
                filterFuseOptions={filterFuseOptions}
                sortRules={initialSortRules}
                dragAndDropHooks={dragAndDropHooks}
                disabledKeys={disabledKeys}
                virtualized
                emptyState={<>Nothing matched your search term.</>}
                aria-label="Source nodes"
                id={sourceCollectionId}
              >
                {sortableProperties && sortableProperties.length > 0 && (
                  <div className="flex w-full flex-col gap-2">
                    <div className="flex flex-wrap gap-2 p-2">
                      {sortableProperties.map((sp) => (
                        <CollectionSortButton
                          key={
                            Array.isArray(sp.property)
                              ? sp.property.join('-')
                              : String(sp.property)
                          }
                          property={sp.property}
                          type={sp.type}
                          label={sp.label}
                        />
                      ))}
                    </div>
                    <CollectionFilterInput
                      className="grow"
                      placeholder="Enter a search term..."
                    />
                  </div>
                )}
              </Collection>
              <AnimatePresence>
                {willAcceptDrop && (
                  <DropOverlay
                    isOver={isOverSource}
                    nodeColor={dropNodeColor ?? 'node-color-seq-1'}
                    message="Drop here to remove"
                  />
                )}
              </AnimatePresence>
            </div>
          )}
        </Panel>
        <NodeList
          id="node-list"
          className={nodeListClasses}
          itemType="ADDED_NODES"
          accepts={['SOURCE_NODES']}
          onDrop={handleAddNode}
          items={nodesForPrompt}
          virtualized
        />
      </ResizableFlexPanel>
    </div>
  );
};

export default NameGeneratorRoster;
