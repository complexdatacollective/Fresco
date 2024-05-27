import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useStore from '~/lib/dnd/store';
import { usePrompts } from '../behaviours/withPrompt';
import Panels from '../components/Panels';
import { actionCreators as sessionActions } from '../ducks/modules/session';
import usePropSelector from '../hooks/usePropSelector';
import { getAdditionalAttributesSelector } from '../selectors/prop';
import { getCurrentStage } from '../selectors/session';
import { get } from '../utils/lodash-replacements';
import NodePanel from './NodePanel';

type NodePanelsProps = {
  disableAddNew?: boolean;
};

export default function NodePanels(props: NodePanelsProps) {
  const { disableAddNew } = props;

  const [isAnyPanelOpen, setAnyPanelOpen] = useState(false);

  const stage = useSelector(getCurrentStage);
  const prompt = usePrompts().prompt;

  const dispatch = useDispatch();

  const removeNodeFromPrompt = (...args) =>
    dispatch(sessionActions.removeNodeFromPrompt(...args));
  const removeNode = (...args) => dispatch(sessionActions.removeNode(...args));

  const draggingItem = useStore((state) => state.draggingItem);

  useEffect(() => {
    setAnyPanelOpen(!!draggingItem);
  }, [draggingItem]);

  const newNodeAttributes = usePropSelector(
    getAdditionalAttributesSelector,
    props,
  );
  const panels = stage.panels ?? [];

  const activePromptId = prompt.id;

  const [panelIndexes, setPanelIndexes] = useState([]);

  const colorPresets = [
    '--nc-primary-color-seq-1',
    '--nc-primary-color-seq-2',
    '--nc-primary-color-seq-3',
    '--nc-primary-color-seq-4',
    '--nc-primary-color-seq-5',
  ];

  const getHighlight = (panelNumber: number) => {
    return colorPresets[panelNumber % colorPresets.length];
  };

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

  const isPanelEmpty = (index) => {
    const count = get(panelIndexes, [index, 'count'], 0);

    return count === 0;
  };

  const isPanelCompatible = (index) => {
    if (panelIndexes.length !== panels.length) {
      return false;
    }

    const panel = panels[index];
    const panelIndex = panelIndexes[index].index;

    // We only accept existing nodes in panels
    if (meta.itemType !== 'EXISTING_NODE') {
      return false;
    }

    // Rules for when panel contains existing nodes
    if (panel.dataSource === 'existing') {
      // Don't allow nodes into existing panel if this is their last prompt ID
      return meta.promptIDs.length !== 1;
    }

    // Rules for when panel contains external data
    // We need the original list though
    return panelIndex && panelIndex.has(meta[entityPrimaryKeyProperty]);
  };

  // const isPanelOpen = (index) => {
  //   const isCompatible = isPanelCompatible(index);
  //   const isNotEmpty = !isPanelEmpty(index);
  //   return isNotEmpty || (isDragging && isCompatible);
  // }

  const handlePanelUpdate = (index, displayCount, nodeIndex) => {
    setPanelIndexes((state) => {
      const panelIndexes = [...state];
      panelIndexes[index] = { count: displayCount, index: nodeIndex };

      return panelIndexes;
    });
  };

  return (
    <Panels show={isAnyPanelOpen}>
      {panels.map((panel, index: number) => {
        return (
          <NodePanel
            key={index}
            panel={panel}
            highlight={getHighlight(index)}
            itemType="NEW_NODE"
            onDrop={handleDrop}
            disableAddNew={disableAddNew}
          />
        );
      })}
    </Panels>
  );
}
