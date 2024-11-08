import { entityAttributesProperty, type NcNode } from '@codaco/shared-consts';
import { memo } from 'react';
import { useSelector } from 'react-redux';
import UINode from '~/lib/ui/components/Node';
import { useNodeLabel } from '../containers/Interfaces/Anonymisation';
import { getNodeColor } from '../selectors/network';

const Node = memo(
  (props: NcNode) => {
    const label = useNodeLabel(props);

    const { type } = props;

    const color = useSelector(getNodeColor(type));

    return <UINode color={color} {...props} label={label} loading={!label} />;
  },
  // Only re-render if attributes change
  (prevProps, nextProps) => {
    return (
      Object.entries(prevProps[entityAttributesProperty]).sort().toString() ===
      Object.entries(nextProps[entityAttributesProperty]).sort().toString()
    );
  },
);

Node.displayName = 'Node';

export default Node;
