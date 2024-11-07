import { type Codebook, type NcNode } from '@codaco/shared-consts';
import { useSelector } from 'react-redux';
import UINode from '~/lib/ui/components/Node';
import { getNodeColor, labelLogic } from '../selectors/network';
import { getProtocolCodebook } from '../selectors/protocol';

/**
 * Renders a Node.
 */

const Node = (props: NcNode) => {
  const { type } = props;

  const color = useSelector(getNodeColor(type));
  const codebook = useSelector(getProtocolCodebook) as Codebook;
  const typeVariables = codebook.node![type]?.variables ?? {};
  const label = labelLogic(typeVariables, props);

  return <UINode color={color} {...props} label={label} />;
};

export default Node;
