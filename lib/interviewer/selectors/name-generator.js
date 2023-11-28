/* eslint-disable import/prefer-default-export */

import { createSelector } from 'reselect';
import { has } from 'lodash';
import { getProtocolCodebook } from './protocol';
import { getIds, getStageSubject } from './prop';
import { getSubjectType } from './interface';

// Selectors that are specific to the name generator

/*
These selectors assume the following props:
  stage: which contains the protocol config for the stage
  prompt: which contains the protocol config for the prompt
*/

const defaultPanelConfiguration = {
  title: '',
  dataSource: 'existing',
  filter: (network) => network,
};

// MemoedSelectors

const stageCardOptions = (_, props) => props.stage.cardOptions;
const stageSortOptions = (_, props) => props.stage.sortOptions;
const propPanels = (_, props) => props.stage.panels;

export const getPromptModelData = createSelector(
  getStageSubject,
  getIds,
  ({ type }, ids) => ({
    type,
    ...ids,
  }),
)

export const makeGetPromptNodeModelData = () => getPromptModelData;

// Returns any additional properties to be displayed on cards.
// Returns an empty array if no additional properties are specified in the protocol.
export const getCardAdditionalProperties = createSelector(
  stageCardOptions,
  (cardOptions) => (has(cardOptions, 'additionalProperties') ? cardOptions.additionalProperties : []),
);

// Returns the properties that are specified as sortable in sortOptions
export const getSortableFields = createSelector(
  stageSortOptions,
  (sortOptions) => (has(sortOptions, 'sortableProperties') ? sortOptions.sortableProperties : []),
);

export const getInitialSortOrder = createSelector(
  stageSortOptions,
  (sortOptions) => (has(sortOptions, 'sortOrder') ? sortOptions.sortOrder : []),
);

export const getNodeIconName = createSelector(
  getProtocolCodebook,
  getSubjectType,
  (codebook, nodeType) => {
    const nodeInfo = codebook.node;
    return (nodeInfo && nodeInfo[nodeType] && nodeInfo[nodeType].iconVariant) || 'add-a-person';
  },
);

export const makeGetNodeIconName = () => getNodeIconName;

export const makeGetPanelConfiguration = () => createSelector(
  propPanels,
  (panels) => (panels ? panels.map((panel) => ({ ...defaultPanelConfiguration, ...panel })) : []),
);
