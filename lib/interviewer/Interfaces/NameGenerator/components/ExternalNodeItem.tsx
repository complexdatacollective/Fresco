import { entityAttributesProperty, type NcNode } from '@codaco/shared-consts';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import UINode from '@codaco/fresco-ui/Node';
import { type ItemProps } from '@codaco/fresco-ui/collection/types';
import { getCodebook } from '~/lib/interviewer/ducks/modules/protocol';
import { useNodeLabel } from '~/lib/interviewer/Interfaces/Anonymisation/useNodeLabel';
import { resolveNodeShape } from '~/lib/interviewer/selectors/session';

type ExternalNodeItemProps = {
  node: NcNode;
  itemProps: ItemProps;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
};

export default function ExternalNodeItem({
  node,
  itemProps,
  size,
  onClick,
}: ExternalNodeItemProps) {
  const codebook = useSelector(getCodebook);
  const nodeTypeDefinition = codebook?.node?.[node.type];

  const label = useNodeLabel(node);

  const shape = useMemo(
    () =>
      nodeTypeDefinition
        ? resolveNodeShape(
            nodeTypeDefinition.shape,
            node[entityAttributesProperty],
          )
        : undefined,
    [nodeTypeDefinition, node],
  );

  if (!nodeTypeDefinition) return null;

  const color = nodeTypeDefinition.color ?? 'node-color-seq-1';

  return (
    <UINode
      {...itemProps}
      color={color}
      shape={shape}
      label={label}
      size={size}
      onClick={onClick}
    />
  );
}
