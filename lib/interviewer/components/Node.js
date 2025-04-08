import { useSelector } from 'react-redux';
import UINode from '~/lib/ui/components/Node';
import { getNodeColor, labelLogic } from '../selectors/network';
import { getProtocolCodebook } from '../selectors/protocol';
import { getEntityAttributes } from '~/lib/interviewer/ducks/modules/network';

/**
 * Renders a Node.
 */

const Node = (props) => {
  const { type } = props;

  const color = useSelector(getNodeColor(type));
  const codebook = useSelector(getProtocolCodebook);
  const label = labelLogic(codebook.node[type], getEntityAttributes(props));

  return <UINode color={color} {...props} label={label} />;
};

export default Node;
