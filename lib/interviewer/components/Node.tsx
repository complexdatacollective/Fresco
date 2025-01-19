import { objectHash } from 'ohash';
import { forwardRef, memo } from 'react';
import { useSelector } from 'react-redux';
import { useNodeLabel } from '~/lib/interviewer/containers/Interfaces/Anonymisation/useNodeLabel';
import { getNodeColor } from '~/lib/interviewer/selectors/network';
import { entityAttributesProperty, type NcNode } from '~/lib/shared-consts';
import UINode from '~/lib/ui/components/Node';

const Node = memo(
  forwardRef<React.ElementRef<typeof UINode>, NcNode>((props: NcNode, ref) => {
    const { type } = props;
    const label = useNodeLabel(props);
    const color = useSelector(getNodeColor(type));

    return <UINode color={color} {...props} label={label} ref={ref} />;
  }),
  (prevProps, nextProps) => {
    return (
      objectHash(prevProps[entityAttributesProperty]) ===
      objectHash(nextProps[entityAttributesProperty])
    );
  },
);

Node.displayName = 'Node';

export default Node;
