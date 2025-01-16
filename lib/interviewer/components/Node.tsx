import { type Codebook } from '@codaco/shared-consts';
import { useSelector } from 'react-redux';
import draggable from '~/lib/dnd/Draggable';
import { type DraggingItem } from '~/lib/dnd/store';
import UINode from '~/lib/ui/components/Node';
import { type NcNode } from '~/schemas/network-canvas';
import { getEntityAttributes } from '~/utils/general';
import { getNodeColor, labelLogic } from '../selectors/network';
import { getProtocolCodebook } from '../selectors/protocol';

type NodeProps = NcNode & {
  type: string;
  ref?: React.RefObject<HTMLDivElement>;
};

const Node = (props: NodeProps) => {
  const { type, ref, ...rest } = props;

  const color = useSelector(getNodeColor(type));
  const codebook = useSelector(getProtocolCodebook) as Codebook;
  const label = labelLogic(codebook.node![type]!, getEntityAttributes(props));

  return (
    <div ref={ref}>
      <UINode color={color} {...rest} label={label} />
    </div>
  );
};

export const createDraggableNode = (item: DraggingItem) =>
  draggable(Node, item);

export default Node;
