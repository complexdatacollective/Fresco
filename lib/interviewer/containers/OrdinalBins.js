import { compose } from '@reduxjs/toolkit';
import color from 'color';
import { isNil } from 'es-toolkit';
import PropTypes from 'prop-types';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '~/lib/shared-consts';
import { MarkdownLabel } from '~/lib/ui/components/Fields';
import { getCSSVariableAsString } from '~/lib/ui/utils/CSSVariables';
import { getEntityAttributes } from '~/utils/general';
import { MonitorDragSource } from '../behaviours/DragAndDrop';
import NodeList from '../components/NodeList';
import { updateNode } from '../ducks/modules/session';
import { makeGetVariableOptions } from '../selectors/interface';
import { getPromptVariable } from '../selectors/prop';
import { getNetworkNodesForType } from '../selectors/session';

class OrdinalBins extends PureComponent {
  promptColor = () => {
    const { prompt } = this.props;

    return prompt.color
      ? color(getCSSVariableAsString(`--nc-${prompt.color}`))
      : color(getCSSVariableAsString('--nc-ord-color-seq-1'));
  };

  backgroundColor = () => color(getCSSVariableAsString('--nc-background'));

  calculateAccentColor = (index, missingValue) => {
    const { bins } = this.props;
    if (missingValue) {
      return color(getCSSVariableAsString('--color-rich-black'))
        .mix(this.backgroundColor(), 0.8)
        .toString();
    }
    const blendRatio = (1 / bins.length) * index;
    return this.promptColor()
      .mix(this.backgroundColor(), blendRatio)
      .toString();
  };

  calculatePanelColor = (index, missingValue) => {
    const { bins } = this.props;
    if (missingValue) {
      return color(getCSSVariableAsString('--color-rich-black'))
        .mix(this.backgroundColor(), 0.9)
        .toString();
    }
    const blendRatio = (1 / bins.length) * index;
    return color(getCSSVariableAsString('--nc-panel-bg-muted'))
      .mix(this.backgroundColor(), blendRatio)
      .toString();
  };

  calculatePanelHighlightColor = (missingValue) => {
    if (missingValue) {
      return this.backgroundColor().toString();
    }
    return color(getCSSVariableAsString('--nc-panel-bg-muted'))
      .mix(this.promptColor(), 0.2)
      .toString();
  };

  renderOrdinalBin = (bin, index) => {
    const { prompt, stage, activePromptVariable, updateNode } = this.props;
    const missingValue = bin.value < 0;

    const onDrop = ({ meta }) => {
      if (getEntityAttributes(meta)[activePromptVariable] === bin.value) {
        return;
      }

      updateNode(
        meta[entityPrimaryKeyProperty],
        {},
        { [activePromptVariable]: bin.value },
        'drop',
      );
    };

    const accentColor = this.calculateAccentColor(index, missingValue);
    const highlightColor = this.calculatePanelHighlightColor(missingValue);
    const panelColor = this.calculatePanelColor(index, missingValue);

    return (
      <div className="ordinal-bin" key={index}>
        <div className="ordinal-bin--title" style={{ background: accentColor }}>
          <h3 className="ordinal-bin--title h3">
            <MarkdownLabel label={bin.label} inline />
          </h3>
        </div>
        <div
          className="ordinal-bin--content"
          style={{ borderBottomColor: accentColor, background: panelColor }}
        >
          <NodeList
            stage={stage}
            listId={`ORDBIN_NODE_LIST_${stage.id}_${prompt.id}_${index}`}
            id={`ORDBIN_NODE_LIST_${index}`}
            items={bin.nodes}
            itemType="NEW_NODE"
            onDrop={(item) => onDrop(item)}
            accepts={() => true}
            hoverColor={highlightColor}
            sortOrder={prompt.binSortOrder}
          />
        </div>
      </div>
    );
  };

  render() {
    const { bins } = this.props;
    return bins.map(this.renderOrdinalBin);
  }
}

OrdinalBins.propTypes = {
  activePromptVariable: PropTypes.string.isRequired,
  bins: PropTypes.array.isRequired,
  prompt: PropTypes.object.isRequired,
  stage: PropTypes.object.isRequired,
  updateNode: PropTypes.func.isRequired,
};

function makeMapStateToProps() {
  const getOrdinalValues = makeGetVariableOptions();

  return function mapStateToProps(state, props) {
    const stageNodes = getNetworkNodesForType(state, props);
    const activePromptVariable = getPromptVariable(state, props);

    return {
      activePromptVariable,
      bins: getOrdinalValues(state, props).map((bin) => {
        const nodes = stageNodes.filter(
          (node) =>
            !isNil(node[entityAttributesProperty][activePromptVariable]) &&
            node[entityAttributesProperty][activePromptVariable] === bin.value,
        );

        return {
          ...bin,
          nodes,
        };
      }),
    };
  };
}

const mapDispatchToProps = {
  updateNode: updateNode,
};

export default compose(
  connect(makeMapStateToProps, mapDispatchToProps),
  MonitorDragSource(['isDragging', 'meta']),
)(OrdinalBins);
