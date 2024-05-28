import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useStore from '~/lib/dnd/store';
import { cn } from '~/utils/shadcn';
import { usePrompts } from '../behaviours/withPrompt';
import { actionCreators as sessionActions } from '../ducks/modules/session';
import usePropSelector from '../hooks/usePropSelector';
import { getAdditionalAttributesSelector } from '../selectors/prop';
import { getCurrentStage } from '../selectors/session';
import NodePanel from './NodePanel';

type NodePanelsProps = {
  disableAddNew?: boolean;
};

const colorPresets = [
  '--nc-primary-color-seq-1',
  '--nc-primary-color-seq-2',
  '--nc-primary-color-seq-3',
  '--nc-primary-color-seq-4',
  '--nc-primary-color-seq-5',
];

export default function NodePanels(props: NodePanelsProps) {
  const { disableAddNew } = props;

  const { panels } = useSelector(getCurrentStage);
  const prompt = usePrompts().prompt;

  const dispatch = useDispatch();

  const [isAnyPanelOpen, setAnyPanelOpen] = useState(false);

  // This state is used to track the number of nodes in each panel so that
  // we can recalculate if any panels are open.
  const [panelNodeCount, setPanelNodeCount] = useState(
    panels?.reduce(
      (acc, panel) => {
        acc[panel.id] = 0;
        return acc;
      },
      {} as Record<string, number>,
    ),
  );

  const itemIsDragging = useStore((state) => !!state.draggingItem);

  useEffect(() => {
    // If there are no panels, we don't need to open any
    if (!panelNodeCount) {
      setAnyPanelOpen(false);
      return;
    }

    // If any panel has nodes, we should open the panels
    const panelsHaveNodes = Object.values(panelNodeCount).some(
      (count) => count > 0,
    );

    if (panelsHaveNodes) {
      setAnyPanelOpen(true);
      return;
    }

    // If an item is dragging, and one of the panels uses external data, we
    // should open the panels incase the user wants to drop it.
    const hasExternalDataPanel = panels!.some(
      (panel) => panel.dataSource === 'external',
    );

    if (itemIsDragging && hasExternalDataPanel) {
      setAnyPanelOpen(true);
    }
  }, [itemIsDragging, panelNodeCount, panels]);

  const removeNodeFromPrompt = (...args) =>
    dispatch(sessionActions.removeNodeFromPrompt(...args));
  const removeNode = (...args) => dispatch(sessionActions.removeNode(...args));

  const newNodeAttributes = usePropSelector(
    getAdditionalAttributesSelector,
    props,
  );

  const handleDrop = ({ meta }, dataSource) => {
    /**
     * Handle a node being dropped into a panel
     * If this panel is showing the interview network, remove the node from the current prompt.
     * If it is an external data panel, remove the node form the interview network.
     */
    if (dataSource === 'existing') {
      removeNodeFromPrompt(
        meta[entityPrimaryKeyProperty],
        prompt.id,
        newNodeAttributes,
      );
    } else {
      removeNode(meta[entityPrimaryKeyProperty]);
    }
  };

  const isPanelCompatible = (index) => {
    const panel = panels!.find((panel) => panel.id === index);

    // We only accept existing nodes in panels
    if (meta.itemType !== 'EXISTING_NODE') {
      return false;
    }

    // Rules for when panel contains existing nodes
    if (panel.dataSource === 'existing') {
      // Don't allow nodes into existing panel if this is their last prompt ID - they should be
      // deleted via the bin instead.
      return meta.promptIDs.length !== 1;
    }

    // Rules for when panel contains external data
    // We need the original list though
    return panelIndex && panelIndex.has(meta[entityPrimaryKeyProperty]);
  };

  const updateParentNodeCount = useCallback(
    (panelId: string) => (count: number) => {
      setPanelNodeCount((prev) => ({
        ...prev,
        [panelId]: count,
      }));
    },
    [],
  );

  if (!panels) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex max-w-96 shrink-0 basis-1/2 flex-col gap-4 transition-all duration-500 ease-in-out md:basis-1/3',
        !isAnyPanelOpen && '!basis-0 overflow-hidden opacity-0',
        isAnyPanelOpen && 'mr-4',
      )}
    >
      {panels.map((panel, index: number) => {
        return (
          <NodePanel
            key={index}
            panel={panel}
            highlight={colorPresets[index % colorPresets.length]}
            itemType="NEW_NODE"
            onDrop={handleDrop}
            disableAddNew={disableAddNew}
            updateParentNodeCount={updateParentNodeCount(panel.id)}
          />
        );
      })}
    </div>
  );
}
