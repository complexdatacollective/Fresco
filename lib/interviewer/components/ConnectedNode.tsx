import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { createSelector } from '@reduxjs/toolkit';
import { motion } from 'motion/react';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import UINode from '~/components/Node';
import {
  getNetworkNodes,
  resolveNodeShape,
} from '~/lib/interviewer/selectors/session';
import { getCodebook } from '../ducks/modules/protocol';
import { useNodeLabel } from '../Interfaces/Anonymisation/useNodeLabel';

type ConnectedNodeProps = Omit<
  React.ComponentProps<typeof UINode>,
  'type' | 'shape' | 'color' | 'label'
> & {
  nodeId: NcNode[typeof entityPrimaryKeyProperty];
  type: NcNode['type'];
  /** Fallback node data for items not yet in the Redux store (e.g. external data panel nodes). */
  fallbackNode?: NcNode;
};

const makeSelectNodeMeta = (
  nodeId: NcNode[typeof entityPrimaryKeyProperty],
  type: NcNode['type'],
) =>
  createSelector(getCodebook, getNetworkNodes, (codebook, nodes) => {
    const nodeTypeDefinition = codebook?.node?.[type];
    const node = nodes.find((n) => n[entityPrimaryKeyProperty] === nodeId);

    // Node or type definition may be missing when a stale selector re-evaluates
    // during React cleanup (Redux notifies synchronously, React unmounts async).
    if (!nodeTypeDefinition) return null;

    const color = nodeTypeDefinition.color ?? 'node-color-seq-1';
    const shapeDef = nodeTypeDefinition.shape;
    return { shapeDef, color, node: node ?? null };
  });

export default function ConnectedNode({
  nodeId,
  type,
  fallbackNode,
  ref,
  ...rest
}: ConnectedNodeProps) {
  const selectNodeMeta = useMemo(
    () => makeSelectNodeMeta(nodeId, type),
    [nodeId, type],
  );

  const nodeMeta = useSelector(selectNodeMeta);

  // Use the Redux node if available, otherwise fall back to the passed-in
  // node data. This handles external data panel nodes that haven't been
  // added to the network yet.
  const node = nodeMeta?.node ?? fallbackNode;
  const label = useNodeLabel(node);

  const shape = useMemo(
    () =>
      node && nodeMeta?.shapeDef
        ? resolveNodeShape(
            nodeMeta.shapeDef,
            node[entityAttributesProperty],
          )
        : undefined,
    [nodeMeta, node],
  );

  // nodeMeta provides codebook info (color/shape). If the codebook entry
  // doesn't exist either, there's nothing to render.
  if (!nodeMeta && !fallbackNode) return null;

  return (
    <UINode
      color={nodeMeta?.color}
      shape={shape}
      label={label}
      ref={ref}
      {...rest}
    />
  );
}

export const ConnectedMotionNode = motion.create(ConnectedNode);
