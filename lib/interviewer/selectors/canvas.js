import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
} from '@codaco/shared-consts';
import { createSelector } from '@reduxjs/toolkit';
import { isNil } from 'es-toolkit';
import { first, get, has } from 'es-toolkit/compat';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';
import createSorter, { processProtocolSortRule } from '../utils/createSorter';
import { getAllVariableUUIDsByEntity } from './protocol';
import {
  getCurrentPrompt,
  getNetworkEdges,
  getNetworkNodes,
  getStageSubject,
} from './session';
import { createDeepEqualSelector } from './utils';

const getPromptLayoutVariable = createSelector(getCurrentPrompt, (prompt) =>
  get(prompt, 'layout.layoutVariable', null),
);

const getPromptSortOptions = createSelector(getCurrentPrompt, (prompt) =>
  get(prompt, 'sortOrder', null),
);

const getPromptDisplayEdges = createDeepEqualSelector(
  getCurrentPrompt,
  (prompt) => get(prompt, 'edges.display', []),
);

/**
 * Selector for next unplaced node.
 *
 * requires:
 * { layout, subject, sortOrder, stage } props
 *
 * Must *ALWAYS* return a node, or null.
 */
export const getNextUnplacedNode = createDeepEqualSelector(
  getNetworkNodes,
  getStageSubject,
  getPromptLayoutVariable,
  getPromptSortOptions,
  getAllVariableUUIDsByEntity,
  (nodes, subject, layoutVariable, sortOptions, codebookVariables) => {
    if (nodes && nodes.length === 0) {
      return null;
    }
    if (!subject) {
      return null;
    }

    // Stage subject is either a single object or a collection of objects
    const types = Array.isArray(subject)
      ? subject.map((s) => s.type)
      : [subject.type];

    // Layout variable is either a string (single stage subject) or an object
    // keyed by node type (two-mode stage subject)
    const layoutVariableForType = (type) => {
      if (typeof layoutVariable === 'string') {
        return layoutVariable;
      }
      return layoutVariable?.[type];
    };

    const unplacedNodes = nodes.filter((node) => {
      const attributes = getEntityAttributes(node);
      return (
        types.includes(node.type) &&
        has(attributes, layoutVariableForType(node.type)) &&
        isNil(attributes[layoutVariableForType(node.type)])
      );
    });

    if (unplacedNodes.length === 0) {
      return undefined;
    }
    if (!sortOptions) {
      return first(unplacedNodes);
    }

    // Protocol sort rules must be processed to be used by createSorter
    const processedSortRules = sortOptions.map(
      processProtocolSortRule(codebookVariables),
    );
    const sorter = createSorter(processedSortRules);
    return first(sorter(unplacedNodes));
  },
);

/**
 * Selector for placed nodes.
 *
 * requires:
 * { layout, subject } props
 *
 * Must *ALWAYS* return an array, even if empty.
 */
export const getPlacedNodes = createDeepEqualSelector(
  getNetworkNodes,
  getStageSubject,
  getPromptLayoutVariable,
  (nodes, subject, layoutVariable) => {
    if (nodes && nodes.length === 0) {
      return [];
    }
    if (!subject) {
      return [];
    }

    // Stage subject is either a single object or a collecton of objects
    const types = Array.isArray(subject)
      ? subject.map((s) => s.type)
      : [subject.type];

    // console.log('layoutVariable', layoutVariable);

    // Layout variable is either a string or an object keyed by node type
    const layoutVariableForType = (type) => {
      if (typeof layoutVariable === 'string') {
        return layoutVariable;
      }
      return layoutVariable?.[type];
    };

    return nodes.filter((node) => {
      const attributes = getEntityAttributes(node);
      return (
        types.includes(node.type) &&
        has(attributes, layoutVariableForType(node.type)) &&
        !isNil(attributes[layoutVariableForType(node.type)])
      );
    });
  },
);

const edgeCoords = (edge, { nodes, layout }) => {
  const from = nodes.find((n) => n[entityPrimaryKeyProperty] === edge.from);
  const to = nodes.find((n) => n[entityPrimaryKeyProperty] === edge.to);

  if (!from || !to) {
    return { from: null, to: null };
  }

  return {
    key: `${edge.from}_${edge.type}_${edge.to}`,
    type: edge.type,
    from: from[entityAttributesProperty][layout],
    to: to[entityAttributesProperty][layout],
  };
};

export const edgesToCoords = (edges, { nodes, layout }) =>
  edges.map((edge) => edgeCoords(edge, { nodes, layout }));

/**
 * Selector for edges.
 *
 * requires:
 * { subject, layout, displayEdges } props
 */
export const getEdges = createDeepEqualSelector(
  getNetworkEdges,
  getPromptDisplayEdges,
  (edges, displayEdges) =>
    edges.filter((edge) => displayEdges.includes(edge.type)),
);

// Selector for stage nodes
export const getNodes = createDeepEqualSelector(
  getNetworkNodes,
  getStageSubject,
  (nodes, subject) => {
    if (!subject) {
      return nodes;
    }
    return nodes.filter((node) => node.type === subject.type);
  },
);
