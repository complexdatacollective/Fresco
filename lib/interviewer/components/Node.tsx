import { type Codebook, type NcNode } from '@codaco/shared-consts';
import { forwardRef } from 'react';
import { useSelector } from 'react-redux';
import { getEntityAttributes } from '~/lib/interviewer/ducks/modules/network';
import UINode, { type UINodeProps } from '~/lib/ui/components/Node';
import { getNodeColor, labelLogic } from '../selectors/network';
import { getProtocolCodebook } from '../selectors/protocol';

type NodeProps = {
  type: string;
} & UINodeProps;

const Node = forwardRef<HTMLDivElement, NodeProps>((props, ref) => {
  const { type } = props;

  const color = useSelector(getNodeColor(type));
  const codebook = useSelector(getProtocolCodebook) as Codebook;
  const attributes = getEntityAttributes(props) as NcNode['attributes'];
  const label = labelLogic(codebook.node![type]!, attributes);

  return <UINode color={color} {...props} label={label} ref={ref} />;
});

Node.displayName = 'Node';

export default Node;
