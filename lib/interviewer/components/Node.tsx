import { forwardRef } from 'react';
import { useSelector } from 'react-redux';
import { type ItemType } from '~/lib/dnd/config';
import draggable from '~/lib/dnd/draggable';
import { getEntityAttributes } from '~/lib/interviewer/ducks/modules/network';
import UINode from '~/lib/ui/components/Node';
import { getNodeColor, labelLogic } from '../selectors/network';
import { getProtocolCodebook } from '../selectors/protocol';

/**
 * Renders a Node.
 */

const Node = forwardRef((props, ref) => {
  const { type } = props;

  const color = useSelector(getNodeColor(type));
  const codebook = useSelector(getProtocolCodebook);
  const label = labelLogic(codebook.node[type], getEntityAttributes(props));

  return (
    <div ref={ref}>
      <UINode color={color} {...props} label={label} />
    </div>
  );
});

Node.displayName = 'Node';

export const createDraggableNode = (itemType: ItemType) =>
  draggable(Node, itemType);

export default Node;
