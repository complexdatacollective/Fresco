import {
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  type NcNode,
} from '@codaco/shared-consts';
import { createSelector } from '@reduxjs/toolkit';
import { invariant } from 'es-toolkit';
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
};

const makeSelectNodeMeta = (
  nodeId: NcNode[typeof entityPrimaryKeyProperty],
  type: NcNode['type'],
) =>
  createSelector(getCodebook, getNetworkNodes, (codebook, nodes) => {
    const nodeTypeDefinition = codebook?.node?.[type];
    invariant(
      nodeTypeDefinition,
      `Node type definition not found for type: ${type}`,
    );

    const node = nodes.find((n) => n[entityPrimaryKeyProperty] === nodeId);
    invariant(node, `Network node not found for id: ${nodeId}`);

    const color = nodeTypeDefinition?.color ?? 'node-color-seq-1';
    const shapeDef = nodeTypeDefinition?.shape;
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

  const { color, shapeDef, node } = useSelector(selectNodeMeta);

  const label = useNodeLabel(node);

  const shape = useMemo(
    () => resolveNodeShape(shapeDef, node[entityAttributesProperty]),
    [shapeDef, node],
  );

  return (
    <UINode color={color} shape={shape} label={label} ref={ref} {...rest} />
  );
}

export const ConnectedMotionNode = motion.create(ConnectedNode);
