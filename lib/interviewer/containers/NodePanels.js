import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { useDndMonitor } from '@dnd-kit/core';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCSSVariableAsString } from '~/lib/ui/utils/CSSVariables';
import { usePrompts } from '../behaviours/withPrompt';
import Panels from '../components/Panels';
import { actionCreators as sessionActions } from '../ducks/modules/session';
import usePropSelector from '../hooks/usePropSelector';
import { defaultPanelConfiguration } from '../selectors/name-generator';
import { getAdditionalAttributesSelector } from '../selectors/prop';
import { getCurrentStage } from '../selectors/session';
import { get } from '../utils/lodash-replacements';
import NodePanel from './NodePanel';

/**
 * Configures and renders `NodePanels` according to the protocol config
 */

export default function NodePanels(props) {
  const {
    disableAddNew,
  } = props;

  const [isAnyPanelOpen, setAnyPanelOpen] = useState(false);

  const stage = useSelector(getCurrentStage);
  const prompt = usePrompts().prompt;

  useDndMonitor({
    onDragStart(event) {
      console.log('onDragStart', event)
      setTimeout(() => {
        setAnyPanelOpen(true);
      }, 10);
    },
    onDragMove(event) {
      console.log('onDragMove', event)
    },
    onDragOver(event) {
      console.log('onDragOver', event)
    },
    onDragEnd(event) {
      setAnyPanelOpen(false);
      console.log('onDragEnd', event)
    },
    onDragCancel(event) {
      console.log('onDragCancel', event)
    },
  });

  const dispatch = useDispatch();

  const removeNodeFromPrompt = (...args) => dispatch(sessionActions.removeNodeFromPrompt(...args));
  const removeNode = (...args) => dispatch(sessionActions.removeNode(...args));


  const newNodeAttributes = usePropSelector(getAdditionalAttributesSelector, props);
  const panels = stage.panels.map((panel) => ({ ...defaultPanelConfiguration, ...panel }))

  const activePromptId = prompt.id;


  const [panelIndexes, setPanelIndexes] = useState([]);

  const colorPresets = useMemo(() => ([
    getCSSVariableAsString('--nc-primary-color-seq-1'),
    getCSSVariableAsString('--nc-primary-color-seq-2'),
    getCSSVariableAsString('--nc-primary-color-seq-3'),
    getCSSVariableAsString('--nc-primary-color-seq-4'),
    getCSSVariableAsString('--nc-primary-color-seq-5'),
  ]), []);

  const getHighlight = (panelNumber) => {
    if (panelNumber === 0) {
      return null;
    }

    return colorPresets[panelNumber % colorPresets.length];
  }

  const handleDrop = ({ meta }, dataSource) => {
    /**
     * Handle a node being dropped into a panel
     * If this panel is showing the interview network, remove the node from the current prompt.
     * If it is an external data panel, remove the node form the interview network.
     */
    if (dataSource === 'existing') {
      removeNodeFromPrompt(meta[entityPrimaryKeyProperty], prompt.id, newNodeAttributes);
    } else {
      removeNode(meta[entityPrimaryKeyProperty]);
    }
  }

  const isPanelEmpty = (index) => {
    const count = get(panelIndexes, [index, 'count'], 0);

    return count === 0;
  }

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
  }

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
  }

  const renderNodePanel = (panel, index) => {
    const { dataSource, filter, ...nodeListProps } = panel;

    return (
      <NodePanel
        {...nodeListProps}
        key={index}
        prompt={prompt}
        stage={stage}
        disableDragNew={disableAddNew}
        dataSource={dataSource}
        filter={filter}
        accepts={() => isPanelCompatible(index)}
        externalDataSource={dataSource !== 'existing' && dataSource}
        highlight={getHighlight(index)}
        minimize={false}
        listId={`PANEL_NODE_LIST_${stage.id}_${prompt.id}_${index}`}
        itemType="NEW_NODE"
        onDrop={handleDrop}
        onUpdate={(nodeCount, nodeIndex) => handlePanelUpdate(index, nodeCount, nodeIndex)}
      />
    );
  }

  return (
    <Panels show={isAnyPanelOpen}>
      {panels.map(renderNodePanel)}
    </Panels>
  );
}
