import { type Panel } from '@codaco/protocol-validation';
import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { invariant } from 'es-toolkit';
import { get } from 'es-toolkit/compat';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDndStore, type DndStore } from '~/lib/dnd';
import Panels from '../../../components/Panels';
import {
  deleteNode as deleteNodeAction,
  removeNodeFromPrompt as removeNodeFromPromptAction,
} from '../../../ducks/modules/session';
import { getPanelConfiguration } from '../../../selectors/name-generator';
import { useAppDispatch } from '../../../store';
import NodePanel from './NodePanel';

/**
 * Configures and renders `NodePanels` according to the protocol config
 */

type NodePanelsProps = {
  disableAddNew: boolean;
  onOpenChange?: (isOpen: boolean) => void;
};

const NodePanelColors = [
  '--primary',
  '--nc-primary-color-seq-1',
  '--nc-primary-color-seq-2',
  '--nc-primary-color-seq-3',
  '--nc-primary-color-seq-4',
] as const;

const getHighlight = (panelNumber: number) => {
  return NodePanelColors[panelNumber % NodePanelColors.length]!;
};

export type HighlightColor = (typeof NodePanelColors)[number];

function NodePanels(props: NodePanelsProps) {
  const [panelIndexes, setPanelIndexes] = useState<
    {
      count: number;
      index: Set<string>;
    }[]
  >([]);

  const { disableAddNew, onOpenChange } = props;
  const isDragging = useDndStore((state: DndStore) => state.isDragging);
  const dragItem = useDndStore((state: DndStore) => state.dragItem);
  const meta = dragItem?.metadata as NcNode & { itemType: string };

  const panels = useSelector(getPanelConfiguration);

  const dispatch = useAppDispatch();

  const removeNodeFromPrompt = useCallback(
    (nodeId: string) => dispatch(removeNodeFromPromptAction(nodeId)),
    [dispatch],
  );
  const deleteNode = useCallback(
    (nodeId: string) => dispatch(deleteNodeAction(nodeId)),
    [dispatch],
  );

  const createDropHandler = useCallback(
    (dataSource: string) => (metadata?: Record<string, unknown>) => {
      const meta = metadata as NcNode | undefined;
      if (!meta) return;

      if (dataSource === 'existing') {
        void removeNodeFromPrompt(meta[entityPrimaryKeyProperty]);
      } else {
        deleteNode(meta[entityPrimaryKeyProperty]);
      }
    },
    [deleteNode, removeNodeFromPrompt],
  );

  const isPanelEmpty = useCallback(
    (index: number) => {
      const count = get(panelIndexes, [index, 'count'], 0);

      return count === 0;
    },
    [panelIndexes],
  );

  const isPanelCompatible = useCallback(
    (index: number) => {
      if (!meta || panelIndexes.length !== panels?.length) {
        return false;
      }

      const panel = panels[index];

      invariant(panel, `Panel ${index} not found`);

      const panelIndex = panelIndexes[index]?.index;

      // We only accept existing nodes in panels
      if (meta.itemType !== 'EXISTING_NODE') {
        return false;
      }

      // Rules for when panel contains existing nodes
      if (panel.dataSource === 'existing') {
        // Don't allow nodes into existing panel if this is their last prompt ID
        return meta.promptIDs?.length !== 1;
      }

      // Rules for when panel contains external data
      // We need the original list though
      return !!panelIndex?.has(meta[entityPrimaryKeyProperty]);
    },
    [meta, panelIndexes, panels],
  );

  const isPanelOpen = useCallback(
    (index: number) => {
      const isCompatible = isPanelCompatible(index);
      const isNotEmpty = !isPanelEmpty(index);
      return isNotEmpty || (isDragging && isCompatible);
    },
    [isDragging, isPanelCompatible, isPanelEmpty],
  );

  const isAnyPanelOpen = useMemo(() => {
    return panels?.some((_panel, index) => isPanelOpen(index)) ?? false;
  }, [isPanelOpen, panels]);

  const prevIsAnyPanelOpen = useRef(isAnyPanelOpen);
  useEffect(() => {
    if (prevIsAnyPanelOpen.current !== isAnyPanelOpen) {
      prevIsAnyPanelOpen.current = isAnyPanelOpen;
      onOpenChange?.(isAnyPanelOpen);
    }
  }, [isAnyPanelOpen, onOpenChange]);

  const handlePanelUpdate = useCallback(
    (index: number) => (displayCount: number, nodeIndex: Set<string>) => {
      // Check if the data has changed
      if (panelIndexes[index]?.count === displayCount) {
        return;
      }

      setPanelIndexes((prev) => {
        const panelIndexes = [...prev];
        panelIndexes[index] = { count: displayCount, index: nodeIndex };
        return panelIndexes;
      });
    },
    [setPanelIndexes, panelIndexes],
  );

  const renderNodePanel = (panel: Panel, index: number) => {
    return (
      <NodePanel
        key={index}
        panelConfig={panel}
        disableDragging={disableAddNew}
        accepts={['EXISTING_NODE']} // TODO: needs to adapt based on panel source
        highlightColor={getHighlight(index)}
        minimize={!isPanelOpen(index)}
        onDrop={createDropHandler(panel.dataSource)}
        onUpdate={handlePanelUpdate(index)}
        id={`PANEL_NODE_LIST_${index}`}
      />
    );
  };

  if (!panels) {
    return null;
  }

  return (
    <Panels minimize={!isAnyPanelOpen}>{panels.map(renderNodePanel)}</Panels>
  );
}

export default NodePanels;
