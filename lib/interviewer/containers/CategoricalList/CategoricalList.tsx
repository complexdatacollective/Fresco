import { entityAttributesProperty } from '@codaco/shared-consts';
import { compose } from '@reduxjs/toolkit';
import cx from 'classnames';
import color from 'color';
import { throttle } from 'es-toolkit';
import React, { useEffect, useRef, useState } from 'react';
import { Flipper } from 'react-flip-toolkit';
import { connect } from 'react-redux';
import { getCSSVariableAsString } from '~/lib/ui/utils/CSSVariables';
import MonitorDragSource from '../../behaviours/DragAndDrop/MonitorDragSource';
import {
  getNetworkNodesForType,
  makeGetVariableOptions,
} from '../../selectors/interface';
import {
  getPromptOtherVariable,
  getPromptVariable,
} from '../../selectors/prop';
import getAbsoluteBoundingRect from '../../utils/getAbsoluteBoundingRect';
import CategoricalListItem from './CategoricalListItem';
import { getExpandedSize, getItemSize } from './helpers';

type BinType = {
  value: any;
  nodes: any[];
  otherVariable?: string;
};

type Props = {
  activePromptVariable: string;
  promptOtherVariable?: string;
  bins: BinType[];
  prompt: {
    id: string;
    binSortOrder?: string;
  };
  stage: {
    id: string;
  };
  expandedBinIndex: number | null;
  onExpandBin: () => void;
};

const isSpecialValue = (value: any): boolean => {
  if (value === null) {
    return true;
  }
  if (typeof value === 'number' && value < 0) {
    return true;
  }
  return false;
};

const CategoricalList: React.FC<Props> = ({
  bins,
  stage,
  prompt,
  activePromptVariable,
  promptOtherVariable,
  onExpandBin,
  expandedBinIndex,
}) => {
  const categoricalListElement = useRef<HTMLDivElement>(null);
  const [colorPresets, setColorPresets] = useState<string[]>([]);
  const [binSizes, setBinSizes] = useState<{
    expandedSize: number;
    itemSize: number;
  }>({
    expandedSize: 0,
    itemSize: 0,
  });

  useEffect(() => {
    setColorPresets([
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
    ]);
  }, []);

  useEffect(() => {
    const handleResize = throttle(() => {
      if (!categoricalListElement.current) return;

      const bounds = getAbsoluteBoundingRect(categoricalListElement.current);
      const isExpanded = expandedBinIndex !== null;

      setBinSizes({
        expandedSize: getExpandedSize(bounds),
        itemSize: getItemSize(bounds, bins.length, isExpanded),
      });
    }, 1000 / 60);

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [bins.length, expandedBinIndex]);

  const getCatColor = (itemNumber: number, bin: BinType): string | null => {
    if (itemNumber < 0) {
      return null;
    }
    const categoryColor = colorPresets[itemNumber % colorPresets.length];

    if (isSpecialValue(bin.value)) {
      return color(categoryColor).desaturate(0.6).darken(0.5).toString();
    }

    return categoryColor;
  };

  const getBinSize = (index: number): number => {
    return expandedBinIndex === index
      ? binSizes.expandedSize
      : binSizes.itemSize;
  };

  const renderCategoricalBins = () => {
    return bins.map((bin, index) => (
      <CategoricalListItem
        id={`CATBIN_ITEM_${stage.id}_${prompt.id}_${index}`}
        key={index}
        index={index}
        bin={bin}
        size={getBinSize(index)}
        activePromptVariable={activePromptVariable}
        promptOtherVariable={promptOtherVariable}
        accentColor={getCatColor(index, bin)}
        onExpandBin={onExpandBin}
        isExpanded={expandedBinIndex === index}
        sortOrder={prompt.binSortOrder}
        stage={stage}
      />
    ));
  };

  const listClasses = cx(
    'categorical-list',
    `categorical-list--items--${bins.length}`,
    { 'categorical-list--expanded': expandedBinIndex !== null },
  );

  const categoricalBins = renderCategoricalBins();
  const expandedBin = categoricalBins[expandedBinIndex ?? -1];
  const otherBins = categoricalBins.filter(
    (_, index) => index !== expandedBinIndex,
  );

  return (
    <div
      className={listClasses}
      ref={categoricalListElement}
      onClick={(e) => {
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

// Rest of the code remains the same (matchVariable, hasOtherVariable, etc.)
const matchVariable = (node: any, variable: string, value: any) =>
  node[entityAttributesProperty][variable]?.includes(value);

const hasOtherVariable = (node: any, otherVariable?: string) =>
  otherVariable && node[entityAttributesProperty][otherVariable] !== null;

const matchBin = (bin: BinType, variable: string) => (node: any) =>
  matchVariable(node, variable, bin.value) ||
  hasOtherVariable(node, bin.otherVariable);

const appendNodesForBin =
  (nodes: any[], activePromptVariable: string) => (bin: BinType) => ({
    ...bin,
    nodes: nodes.filter(matchBin(bin, activePromptVariable)),
  });

function makeMapStateToProps() {
  const getCategoricalValues = makeGetVariableOptions(true);

  return function mapStateToProps(state: any, props: any) {
    const stageNodes = getNetworkNodesForType(state, props);
    const activePromptVariable = getPromptVariable(state, props);
    const [promptOtherVariable, promptOtherVariablePrompt] =
      getPromptOtherVariable(state, props);
    const bins = getCategoricalValues(state, props).map(
      appendNodesForBin(stageNodes, activePromptVariable),
    );

    return {
      activePromptVariable,
      promptOtherVariable,
      promptOtherVariablePrompt,
      bins,
    };
  };
}

export default compose(
  connect(makeMapStateToProps),
  MonitorDragSource(['isDragging', 'meta']),
)(CategoricalList);
