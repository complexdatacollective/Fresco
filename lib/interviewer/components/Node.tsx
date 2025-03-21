import { type NcNode } from '@codaco/shared-consts';
import { forwardRef, memo } from 'react';
import { useSelector } from 'react-redux';
import { getNodeColor } from '~/lib/interviewer/selectors/session';
import UINode from '~/lib/ui/components/Node';
import { useNodeLabel } from '../containers/Interfaces/Anonymisation/useNodeLabel';

const Node = memo(
  forwardRef<React.ElementRef<typeof UINode>, NcNode>((props: NcNode, ref) => {
    // const [label, setLabel] = useState<string | undefined>(undefined);
    // const [loading, setLoading] = useState(true);
    const { type } = props;
    const color = useSelector(getNodeColor(type));
    const label = useNodeLabel(props);

    return (
      <UINode
        color={color}
        {...props}
        label={label}
        ref={ref}
        loading={!label}
      />
    );
  }),
  // (prevProps, nextProps) => {
  //   return (
  //     objectHash(prevProps[entityAttributesProperty]) ===
  //     objectHash(nextProps[entityAttributesProperty])
  //   );
  // },
);

Node.displayName = 'Node';

export default Node;
