import {
    entityAttributesProperty,
    entityPrimaryKeyProperty,
    type NcNode,
} from '@codaco/shared-consts';
import { createSelector } from '@reduxjs/toolkit';
import { motion } from 'motion/react';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import UINode from '@codaco/fresco-ui/Node';
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
    if (!nodeTypeDefinition || !node) return null;

    const color = nodeTypeDefinition.color ?? 'node-color-seq-1';
    const shapeDef = nodeTypeDefinition.shape;
    return { shapeDef, color, node };
  });

export default function ConnectedNode({
  nodeId,
  type,
  ref,
  ...rest
}: ConnectedNodeProps) {
  const selectNodeMeta = useMemo(
    () => makeSelectNodeMeta(nodeId, type),
    [nodeId, type],
  );

  const nodeMeta = useSelector(selectNodeMeta);

  const node = nodeMeta?.node;
  const label = useNodeLabel(node);

  const shape = useMemo(
    () =>
      node
        ? resolveNodeShape(nodeMeta.shapeDef, node[entityAttributesProperty])
        : undefined,
    [nodeMeta, node],
  );

  if (!nodeMeta) return null;

  return (
    <UINode
      color={nodeMeta.color}
      shape={shape}
      label={label}
      ref={ref}
      {...rest}
    />
  );
}

export const ConnectedMotionNode = motion.create(ConnectedNode);
