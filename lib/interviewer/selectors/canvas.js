import { createSelector } from '@reduxjs/toolkit';
import { isNil } from 'es-toolkit';
import { get, has } from 'es-toolkit/compat';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';
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

const getPromptDisplayEdges = createDeepEqualSelector(
  getCurrentPrompt,
  (prompt) => get(prompt, 'edges.display', []),
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

/**
 * Selector for all unplaced nodes (for the drawer).
 *
 * Returns all nodes of the stage subject type that have a nil layout variable.
 */
export const getUnplacedNodes = createDeepEqualSelector(
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

    const types = Array.isArray(subject)
      ? subject.map((s) => s.type)
      : [subject.type];

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
        isNil(attributes[layoutVariableForType(node.type)])
      );
    });
  },
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
