import { type Stage } from '@codaco/protocol-validation';
import { type NcNetwork } from '@codaco/shared-consts';
import { createSelector } from '@reduxjs/toolkit';
import { has, invariant } from 'es-toolkit/compat';
import { getCodebook } from '../ducks/modules/protocol';
import {
  getPromptId,
  getStageIndex,
  getStageSubject,
  getSubjectType,
} from './session';

// Selectors that are specific to the name generator

/*
These selectors assume the following props:
  stage: which contains the protocol config for the stage
  prompt: which contains the protocol config for the prompt
*/

const defaultPanelConfiguration = {
  title: '',
  dataSource: 'existing',
  filter: (network: NcNetwork) => network,
};

// MemoedSelectors

const stageCardOptions = (
  _: unknown,
  props: {
    stage: Extract<Stage, { type: 'NameGeneratorRoster' }>;
  },
) => props.stage.cardOptions;

const propPanels = (
  _: unknown,
  props: {
    stage: Extract<Stage, { type: 'NameGenerator' }>;
  },
) => props.stage.panels;

const getIDs = createSelector(
  getStageIndex,
  getPromptId,
  (stageId, promptId) => {
    return {
      stageId,
      promptId,
    };
  },
);

export const getPromptModelData = createSelector(
  getStageSubject,
  getIDs,
  (subject, { stageId, promptId }) => {
    invariant(subject, 'Subject is required');
    if (subject.entity === 'ego') {
      throw new Error('Ego subject is not supported');
    }

    return {
      type: subject.type,
      stageId,
      promptId,
    };
  },
);

// Returns any additional properties to be displayed on cards.
// Returns an empty array if no additional properties are specified in the protocol.
export const getCardAdditionalProperties = createSelector(
  stageCardOptions,
  (cardOptions) =>
    has(cardOptions, 'additionalProperties')
      ? cardOptions!.additionalProperties // Todo: should correctly narrow the type based on stage type
      : [],
);

export const getNodeIconName = createSelector(
  getCodebook,
  getSubjectType,
  (codebook, nodeType) => {
    invariant(nodeType, 'Node type is required');

    const nodeIcon = codebook.node?.[nodeType]?.iconVariant ?? 'add-a-person';

    return nodeIcon;
  },
);

export const makeGetPanelConfiguration = () =>
  createSelector(propPanels, (panels) =>
    panels
      ? panels.map((panel) => ({ ...defaultPanelConfiguration, ...panel }))
      : [],
  );
