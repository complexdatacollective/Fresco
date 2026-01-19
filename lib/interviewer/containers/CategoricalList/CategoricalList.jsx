import { entityAttributesProperty } from '@codaco/shared-consts';
import cx from 'classnames';
import color from 'color';
import { throttle } from 'es-toolkit';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flipper } from 'react-flip-toolkit';
import { connect } from 'react-redux';
import { getCSSVariableAsString } from '~/lib/legacy-ui/utils/CSSVariables';
import { makeGetVariableOptions } from '../../selectors/interface';
import {
  getPromptOtherVariable,
  getPromptVariable,
} from '../../selectors/prop';
import {
  getCurrentStage,
  getNetworkNodesForType,
  getPromptId,
} from '../../selectors/session';
import getAbsoluteBoundingRect from '../../utils/getAbsoluteBoundingRect';
import CategoricalListItem from './CategoricalListItem';
import { getExpandedSize, getItemSize } from './helpers';

const isSpecialValue = (value) => {
  if (value === null) {
    return true;
  }
  if (typeof value === 'number' && value < 0) {
    return true;
  }
  return false;
};

/**
 * CategoricalList: Renders a list of categorical bin items
 */
const CategoricalList = ({
  bins,
  promptId,
  stageId,
  activePromptVariable,
  promptOtherVariable,
  onExpandBin,
  expandedBinIndex,
}) => {
  const categoricalListElement = useRef();
  const [, forceUpdate] = useState();

  const colorPresets = useMemo(
    () => [
      getCSSVariableAsString('--nc-cat-color-seq-1'),
      getCSSVariableAsString('--nc-cat-color-seq-2'),
      getCSSVariableAsString('--nc-cat-color-seq-3'),
      getCSSVariableAsString('--nc-cat-color-seq-4'),
      getCSSVariableAsString('--nc-cat-color-seq-5'),
      getCSSVariableAsString('--nc-cat-color-seq-6'),
      getCSSVariableAsString('--nc-cat-color-seq-7'),
      getCSSVariableAsString('--nc-cat-color-seq-8'),
      getCSSVariableAsString('--nc-cat-color-seq-9'),
      getCSSVariableAsString('--nc-cat-color-seq-10'),
    ],
    [],
  );

  const onResize = useCallback(
    () =>
      throttle(() => {
        forceUpdate({});
      }, 1000 / 60)(),
    [forceUpdate],
  );

  useEffect(() => {
    window.addEventListener('resize', onResize);
    onResize();
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [onResize]);

  const binSizes = useCallback(() => {
    if (!categoricalListElement.current) {
      return { expandedSize: 0, itemSize: 0 };
    }

    const categoricalListElementCurrent = categoricalListElement.current;
    const bounds = getAbsoluteBoundingRect(categoricalListElementCurrent);
    const isExpanded = expandedBinIndex !== null;
    const expandedSize = getExpandedSize(bounds);
    const itemSize = getItemSize(bounds, bins.length, isExpanded);

    return {
      expandedSize,
      itemSize,
    };
  }, [bins.length, expandedBinIndex]);

  const getCatColor = useCallback(
    (itemNumber, bin) => {
      if (itemNumber < 0) {
        return null;
      }
      const categoryColor = colorPresets[itemNumber % colorPresets.length];

      if (isSpecialValue(bin.value)) {
        return color(categoryColor).desaturate(0.6).darken(0.5).toString();
      }

      return categoryColor;
    },
    [colorPresets],
  );

  const getBinSize = useCallback(
    (index) => {
      const sizes = binSizes();
      return expandedBinIndex === index ? sizes.expandedSize : sizes.itemSize;
    },
    [expandedBinIndex, binSizes],
  );

  const renderCategoricalBins = useCallback(() => {
    return bins.map((bin, index) => (
      <CategoricalListItem
        id={`CATBIN_ITEM_${stageId}_${promptId}_${index}`}
        key={index}
        index={index}
        bin={bin}
        size={getBinSize(index)}
        activePromptVariable={activePromptVariable}
        promptOtherVariable={promptOtherVariable}
        accentColor={getCatColor(index, bin)}
        onExpandBin={onExpandBin}
        isExpanded={expandedBinIndex === index}
      />
    ));
  }, [
    bins,
    stageId,
    promptId,
    getBinSize,
    activePromptVariable,
    promptOtherVariable,
    getCatColor,
    onExpandBin,
    expandedBinIndex,
  ]);

  const listClasses = cx(
    'categorical-list',
    `categorical-list--items--${bins.length}`,
    { 'categorical-list--expanded': expandedBinIndex !== null },
  );

  // Render before filter, because we need to preserve order for colors.
  const categoricalBins = renderCategoricalBins();
  const expandedBin = categoricalBins[expandedBinIndex];
  const otherBins = categoricalBins.filter(
    (_, index) => index !== expandedBinIndex,
  );

  return (
    <div
      className={listClasses}
      ref={categoricalListElement}
      onClick={(e) => {
        // Allow resetting the expanded bin by clicking outside the bin
        e.stopPropagation();
        onExpandBin();
      }}
    >
      <Flipper flipKey={expandedBinIndex} className="categorical-list__items">
        {expandedBin}
        {otherBins}
      </Flipper>
    </div>
  );
};

CategoricalList.propTypes = {
  activePromptVariable: PropTypes.string.isRequired,
  promptOtherVariable: PropTypes.string,
  bins: PropTypes.array.isRequired,
  prompt: PropTypes.object.isRequired,
  stage: PropTypes.object.isRequired,
  expandedBinIndex: PropTypes.number,
  onExpandBin: PropTypes.func.isRequired,
};

const matchVariable = (node, variable, value) => {
  const nodeValue = node[entityAttributesProperty][variable];
  if (!nodeValue) return false;

  // Handle array values
  if (Array.isArray(nodeValue)) {
    return nodeValue.includes(value);
  }

  // Handle single values
  return nodeValue === value;
};

const hasOtherVariable = (node, otherVariable) =>
  otherVariable && node[entityAttributesProperty][otherVariable] !== null;

const matchBin = (bin, variable) => (node) =>
  matchVariable(node, variable, bin.value) ||
  hasOtherVariable(node, bin.otherVariable);

const appendNodesForBin = (nodes, activePromptVariable) => (bin) => ({
  ...bin,
  nodes: nodes.filter(matchBin(bin, activePromptVariable)),
});

function makeMapStateToProps() {
  const getCategoricalValues = makeGetVariableOptions(true);

  return function mapStateToProps(state, props) {
    const stage = getCurrentStage(state);
    const promptId = getPromptId(state);
    const stageNodes = getNetworkNodesForType(state, props);
    const activePromptVariable = getPromptVariable(state, props);
    const [promptOtherVariable, promptOtherVariablePrompt] =
      getPromptOtherVariable(state, props);
    const bins = getCategoricalValues(state, props).map(
      appendNodesForBin(stageNodes, activePromptVariable),
    );

    return {
      stageId: stage.id,
      prompt: promptId,
      activePromptVariable,
      promptOtherVariable,
      promptOtherVariablePrompt,
      bins,
    };
  };
}

export default connect(makeMapStateToProps)(CategoricalList);
