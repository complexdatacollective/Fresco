import { type NcNode } from '@codaco/shared-consts';
import { isEqual } from 'es-toolkit';
import { motion } from 'motion/react';
import React, { forwardRef, memo, useMemo } from 'react';
import { useSelector } from 'react-redux';
import UINode from '~/components/Node';
import {
  getNodeColorSelector,
  getNodeShapeDefinition,
  resolveNodeShape,
} from '~/lib/interviewer/selectors/session';
import { useNodeLabel } from '../Interfaces/Anonymisation/useNodeLabel';

type NodeProps = NcNode & Omit<React.ComponentProps<typeof UINode>, 'type'>;

const Node = memo(
  forwardRef<React.ComponentRef<typeof UINode>, NodeProps>(
    (props: NodeProps, ref) => {
      const color = useSelector(getNodeColorSelector);
      const shapeDef = useSelector(getNodeShapeDefinition);
      const label = useNodeLabel(props);

      const shape = useMemo(() => {
        if (!shapeDef) return props.shape;
        return resolveNodeShape(shapeDef, props.attributes ?? {});
      }, [shapeDef, props.attributes, props.shape]);

      // Exclude NcNode data properties that aren't valid HTML attributes
      /* eslint-disable @typescript-eslint/no-unused-vars */
      const {
        type: _nodeType,
        _uid,
        attributes: _attributes,
        _secureAttributes,
        stageId: _stageId,
        promptIDs: _promptIDs,
        ...uiNodeProps
      } = props;
      /* eslint-enable @typescript-eslint/no-unused-vars */

      return (
        <UINode
          color={color}
          {...uiNodeProps}
          shape={shape}
          label={label}
          ref={ref}
        />
      );
    },
  ),
  (prevProps, nextProps) => {
    if (!isEqual(prevProps, nextProps)) {
      return false;
    }

    return true;
  },
);

Node.displayName = 'Node';

export default Node;

export const MotionNode = motion.create(Node);
