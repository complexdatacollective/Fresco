import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import color from 'color';
import { isNil } from 'es-toolkit';
import PropTypes from 'prop-types';
import { useCallback } from 'react';
import { connect } from 'react-redux';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';
import { MarkdownLabel } from '~/lib/ui/components/Fields';
import { getCSSVariableAsString } from '~/lib/ui/utils/CSSVariables';
import { withNoSSRWrapper } from '~/utils/NoSSRWrapper';
import NodeList from '../components/NodeList';
import { updateNode } from '../ducks/modules/session';
import { makeGetVariableOptions } from '../selectors/interface';
import { getPromptVariable } from '../selectors/prop';
import { getNetworkNodesForType } from '../selectors/session';
import createSorter from '../utils/createSorter';

const OrdinalBins = ({
  bins,
  prompt,
  stage,
  activePromptVariable,
  updateNode,
}) => {
  const promptColor = useCallback(() => {
    return prompt.color
      ? color(getCSSVariableAsString(`--nc-${prompt.color}`))
      : color(getCSSVariableAsString('--nc-ord-color-seq-1'));
  }, [prompt.color]);

  const backgroundColor = useCallback(
    () => color(getCSSVariableAsString('--nc-background')),
    [],
  );

  const calculateAccentColor = useCallback(
    (index, missingValue) => {
      if (missingValue) {
        return color(getCSSVariableAsString('--color-rich-black'))
          .mix(backgroundColor(), 0.8)
          .toString();
      }
      const blendRatio = (1 / bins.length) * index;
      return promptColor().mix(backgroundColor(), blendRatio).toString();
    },
    [bins.length, promptColor, backgroundColor],
  );

  const calculatePanelColor = useCallback(
    (index, missingValue) => {
      if (missingValue) {
        return color(getCSSVariableAsString('--color-rich-black'))
          .mix(backgroundColor(), 0.9)
          .toString();
      }
      const blendRatio = (1 / bins.length) * index;
      return color(getCSSVariableAsString('--nc-panel-bg-muted'))
        .mix(backgroundColor(), blendRatio)
        .toString();
    },
    [bins.length, backgroundColor],
  );

  const calculatePanelHighlightColor = useCallback(
    (missingValue) => {
      if (missingValue) {
        return backgroundColor().toString();
      }
      return color(getCSSVariableAsString('--nc-panel-bg-muted'))
        .mix(promptColor(), 0.2)
        .toString();
    },
    [backgroundColor, promptColor],
  );

  const renderOrdinalBin = useCallback(
    (bin, index) => {
      const missingValue = bin.value < 0;

      const onDrop = ({ meta }) => {
        if (getEntityAttributes(meta)[activePromptVariable] === bin.value) {
          return;
        }

        updateNode({
          nodeId: meta[entityPrimaryKeyProperty],
          newAttributeData: { [activePromptVariable]: bin.value },
        });
      };

      const accentColor = calculateAccentColor(index, missingValue);
      const highlightColor = calculatePanelHighlightColor(missingValue);
      const panelColor = calculatePanelColor(index, missingValue);

      const sorter = createSorter(prompt.binSortOrder);
      const sortedNodes = sorter(bin.nodes);

      return (
        <div className="ordinal-bin" key={index}>
          <div
            className="ordinal-bin--title"
            style={{ background: accentColor }}
          >
            <h3 className="ordinal-bin--title h3">
              <MarkdownLabel label={bin.label} inline />
            </h3>
          </div>
          <div
            className="ordinal-bin--content overflow-hidden"
            style={{ borderBottomColor: accentColor, background: panelColor }}
          >
            <NodeList
              id={`ORDBIN_NODE_LIST_${stage.id}_${prompt.id}_${index}`}
              items={sortedNodes}
              itemType="NEW_NODE"
              accepts={['NEW_NODE', 'EXISTING_NODE']}
              onDrop={(item) => onDrop({ meta: item })}
              hoverColor={highlightColor}
              className="h-full content-center"
              showAcceptHighlight={false}
              nodeSize="xs"
            />
          </div>
        </div>
      );
    },
    [
      activePromptVariable,
      updateNode,
      calculateAccentColor,
      calculatePanelHighlightColor,
      calculatePanelColor,
      prompt,
      stage.id,
    ],
  );

  return bins.map(renderOrdinalBin);
};

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

export default withNoSSRWrapper(
  connect(makeMapStateToProps, mapDispatchToProps)(OrdinalBins),
);
