import { entityAttributesProperty, type NcNode } from '@codaco/shared-consts';
import { memo, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { type Codebook } from '~/lib/protocol-validation/schemas/src/8.zod';
import UINode from '~/lib/ui/components/Node';
import { getNodeColor, labelLogic } from '../selectors/network';
import { getProtocolCodebook } from '../selectors/protocol';

/**
 * Renders a Node.
 */

const Node = memo(
  (props: NcNode) => {
    const [label, setLabel] = useState<string | null>('...');
    const { type } = props;

    const color = useSelector(getNodeColor(type));
    const codebook = useSelector(getProtocolCodebook) as Codebook;
    const typeVariables = useMemo(
      () => codebook.node[type]?.variables ?? {},
      [codebook, type],
    );

    useEffect(() => {
      async function fetchLabel() {
        const label = await labelLogic(typeVariables, props);
        setLabel(label);
      }

      fetchLabel().catch((e) => {
        setLabel('Error');
        console.error(e);
      });
    }, [props, typeVariables]);

    console.log('label', label);

    return <UINode color={color} {...props} label={label} />;
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
