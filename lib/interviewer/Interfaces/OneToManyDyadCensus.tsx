import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { AnimatePresence } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Surface from '~/components/layout/Surface';
import { Collection } from '~/lib/collection/components/Collection';
import { InlineGridLayout } from '~/lib/collection/layout/InlineGridLayout';
import { type ItemProps } from '~/lib/collection/types';
import { usePrompts } from '~/lib/interviewer/components/Prompts/usePrompts';
import { type StageProps } from '~/lib/interviewer/types';
import { MotionNode } from '../components/Node';
import Prompts from '../components/Prompts';
import { edgeExists, toggleEdge } from '../ducks/modules/session';
import useSortedNodeList from '../hooks/useSortedNodeList';
import { getNetworkEdges, getNetworkNodesForType } from '../selectors/session';
import { useAppDispatch } from '../store';
import { type ProtocolSortRule } from '../utils/createSorter';

type OneToManyDyadCensusProps = StageProps<'OneToManyDyadCensus'>;

function OneToManyDyadCensus(props: OneToManyDyadCensusProps) {
  const {
    registerBeforeNext,
    stage: {
      behaviours: { removeAfterConsideration },
    },
  } = props;

  const [currentStep, setCurrentStep] = useState(0);

  const dispatch = useAppDispatch();

  const {
    prompt: { createEdge, bucketSortOrder, binSortOrder },
    promptIndex,
  } = usePrompts<{
    createEdge: string;
    bucketSortOrder?: ProtocolSortRule[];
    binSortOrder?: ProtocolSortRule[];
  }>();

  const nodes = useSelector(getNetworkNodesForType);
  const edges = useSelector(getNetworkEdges);

  const sortedSource = useSortedNodeList(nodes, bucketSortOrder);

  const source = sortedSource[currentStep]!;

  const sortedTargets = useSortedNodeList(
    nodes.filter(
      (node) =>
        node[entityPrimaryKeyProperty] !== source[entityPrimaryKeyProperty],
    ),
    binSortOrder,
  );

  // Takes into account removeAfterConsideration
  // There is one less step if we are removing the source node from the list
  const numberOfSteps = removeAfterConsideration
    ? sortedTargets.length - 1
    : sortedTargets.length;

  /**
   * Hijack stage navigation:
   * - If we are moving forward and not on the last step, increment the step
   * - If we are moving forward and on the last step, allow navigation
   * - If we are moving backward, decrement the step until we reach 0
   * - If we are moving backward and on step 0, allow navigation
   */
  registerBeforeNext((direction) => {
    if (direction === 'forwards') {
      if (currentStep + 1 <= numberOfSteps) {
        setCurrentStep((prev) => prev + 1);
        return false;
      }

      return true;
    }

    if (direction === 'backwards') {
      if (currentStep > 0) {
        setCurrentStep((prev) => prev - 1);
        return false;
      }

      return true;
    }

    return true;
  });

  // Reset the step when the prompt changes
  useEffect(() => {
    setCurrentStep(0);
  }, [promptIndex]);

  const handleNodeClick = useCallback(
    (sourceNode: NcNode, target: NcNode) => () => {
      const edgeAction = toggleEdge({
        from: sourceNode[entityPrimaryKeyProperty],
        to: target[entityPrimaryKeyProperty],
        type: createEdge,
      });

      void dispatch(edgeAction);
    },
    [createEdge, dispatch],
  );

  const layout = useMemo(() => new InlineGridLayout<NcNode>({ gap: 16 }), []);

  const keyExtractor = useCallback(
    (node: NcNode) => node[entityPrimaryKeyProperty],
    [],
  );

  const filteredTargets = useMemo(() => {
    if (!removeAfterConsideration) return sortedTargets;
    return sortedTargets.filter((node) => {
      const sortedIndex = sortedSource.findIndex(
        (s) => s[entityPrimaryKeyProperty] === node[entityPrimaryKeyProperty],
      );
      return sortedIndex >= currentStep;
    });
  }, [sortedTargets, sortedSource, removeAfterConsideration, currentStep]);

  const renderItem = useCallback(
    (node: NcNode, itemProps: ItemProps) => {
      const selected = !!edgeExists(
        edges,
        node[entityPrimaryKeyProperty],
        source[entityPrimaryKeyProperty],
        createEdge,
      );
      return (
        <MotionNode
          {...node}
          {...itemProps}
          selected={selected}
          onClick={handleNodeClick(source, node)}
          layoutId={node[entityPrimaryKeyProperty]}
        />
      );
    },
    [edges, source, createEdge, handleNodeClick],
  );

  return (
    <div className="interface flex size-full flex-col gap-4">
      <Prompts />
      <AnimatePresence mode="popLayout">
        {source ? (
          <MotionNode
            {...source}
            size="sm"
            layoutId={source[entityPrimaryKeyProperty]}
            key={source[entityPrimaryKeyProperty]}
          />
        ) : (
          <div key="missing" className="flex h-24 items-center justify-center">
            No nodes available to display.
          </div>
        )}
      </AnimatePresence>
      <Surface noContainer className="flex grow flex-col" spacing="none">
        <div className="flex w-full items-center justify-center p-4">
          <h4>Click/tap all that apply:</h4>
        </div>
        <Collection
          key={promptIndex}
          id="dyad-census-targets"
          items={filteredTargets}
          keyExtractor={keyExtractor}
          layout={layout}
          renderItem={renderItem}
          selectionMode="none"
          layoutGroupId={null}
          viewportClassName="p-4"
          aria-label="Target nodes"
          emptyState={<h3>No nodes to display.</h3>}
        />
      </Surface>
    </div>
  );
}

export default OneToManyDyadCensus;
