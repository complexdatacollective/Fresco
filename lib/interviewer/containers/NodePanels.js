import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { compose } from '@reduxjs/toolkit';
import { get } from 'es-toolkit/compat';
import PropTypes from 'prop-types';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import { getCSSVariableAsString } from '~/lib/ui/utils/CSSVariables';
import { MonitorDragSource } from '../behaviours/DragAndDrop';
import Panels from '../components/Panels';
import { actionCreators as sessionActions } from '../ducks/modules/session';
import { makeGetPanelConfiguration } from '../selectors/name-generator';
import { makeGetAdditionalAttributes } from '../selectors/prop';
import NodePanel from './NodePanel';

/**
 * Configures and renders `NodePanels` according to the protocol config
 */

class NodePanels extends PureComponent {
  static defaultProps = {
    isDragging: false,
    meta: {},
    panels: [],
    prompt: { id: null },
    stage: { id: null },
  };

  constructor(props) {
    super(props);

    this.state = {
      panelIndexes: [],
    };

    this.colorPresets = [
      getCSSVariableAsString('--nc-primary-color-seq-1'),
      getCSSVariableAsString('--nc-primary-color-seq-2'),
      getCSSVariableAsString('--nc-primary-color-seq-3'),
      getCSSVariableAsString('--nc-primary-color-seq-4'),
      getCSSVariableAsString('--nc-primary-color-seq-5'),
    ];
  }

  getHighlight = (panelNumber) => {
    if (panelNumber === 0) {
      return null;
    }

    return this.colorPresets[panelNumber % this.colorPresets.length];
  };

  handleDrop = ({ meta }, dataSource) => {
    const { removeNodeFromPrompt, prompt, newNodeAttributes, removeNode } =
      this.props;
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

  isPanelEmpty = (index) => {
    const { panelIndexes } = this.state;
    const count = get(panelIndexes, [index, 'count'], 0);

    return count === 0;
  };

  isPanelCompatible = (index) => {
    const { panels, meta } = this.props;
    const { panelIndexes } = this.state;

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

  isPanelOpen = (index) => {
    const { isDragging } = this.props;
    const isCompatible = this.isPanelCompatible(index);
    const isNotEmpty = !this.isPanelEmpty(index);
    return isNotEmpty || (isDragging && isCompatible);
  };

  isAnyPanelOpen = () => {
    const { panels } = this.props;
    return panels.some((panel, index) => this.isPanelOpen(index));
  };

  handlePanelUpdate = (index, displayCount, nodeIndex) => {
    this.setState((state) => {
      const panelIndexes = [...state.panelIndexes];
      panelIndexes[index] = { count: displayCount, index: nodeIndex };

      return {
        panelIndexes,
      };
    });
  };

  renderNodePanel = (panel, index) => {
    const { stage, prompt, disableAddNew } = this.props;

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
        accepts={() => this.isPanelCompatible(index)}
        externalDataSource={dataSource !== 'existing' && dataSource}
        highlight={this.getHighlight(index)}
        minimize={!this.isPanelOpen(index)}
        id={`PANEL_NODE_LIST_${index}`}
        listId={`PANEL_NODE_LIST_${stage.id}_${prompt.id}_${index}`}
        itemType="NEW_NODE"
        onDrop={this.handleDrop}
        onUpdate={(nodeCount, nodeIndex) =>
          this.handlePanelUpdate(index, nodeCount, nodeIndex)
        }
      />
    );
  };

  render() {
    const { panels } = this.props;

    return (
      <Panels minimize={!this.isAnyPanelOpen()}>
        {panels.map(this.renderNodePanel)}
      </Panels>
    );
  }
}

NodePanels.propTypes = {
  isDragging: PropTypes.bool,
  meta: PropTypes.object,
  panels: PropTypes.array,
  prompt: PropTypes.object,
  newNodeAttributes: PropTypes.object.isRequired,
  removeNode: PropTypes.func.isRequired,
  stage: PropTypes.object,
  removeNodeFromPrompt: PropTypes.func.isRequired,
};

function makeMapStateToProps() {
  const getPromptNodeAttributes = makeGetAdditionalAttributes();
  const getPanelConfiguration = makeGetPanelConfiguration();

  return function mapStateToProps(state, props) {
    const newNodeAttributes = getPromptNodeAttributes(state, props);
    const panels = getPanelConfiguration(state, props);

    return {
      activePromptId: props.prompt.id,
      newNodeAttributes,
      panels,
    };
  };
}

const mapDispatchToProps = {
  removeNodeFromPrompt: sessionActions.removeNodeFromPrompt,
  removeNode: sessionActions.removeNode,
};

export default compose(
  connect(makeMapStateToProps, mapDispatchToProps),
  MonitorDragSource(['isDragging', 'meta']),
)(NodePanels);
