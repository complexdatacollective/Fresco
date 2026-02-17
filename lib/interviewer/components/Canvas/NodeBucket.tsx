'use client';

import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { isNull, isUndefined } from 'es-toolkit';
import { AnimatePresence, motion } from 'motion/react';
import { useContext, useRef } from 'react';
import { DragSource } from '../../behaviours/DragAndDrop';
import { NO_SCROLL } from '../../behaviours/DragAndDrop/DragManager';
import useDropObstacle from '../../behaviours/DragAndDrop/useDropObstacle';
import LayoutContext from '../../contexts/LayoutContext';
import Node from '../Node';

const EnhancedNode = DragSource(Node);

type NcNode = Record<string, unknown>;

type NodeBucketProps = {
  id: string;
  allowPositioning: boolean;
  node: NcNode | null | undefined;
};

const NodeBucket = ({ id, allowPositioning, node }: NodeBucketProps) => {
  const obstacleRef = useRef<HTMLDivElement>(null);
  const { allowAutomaticLayout } = useContext(LayoutContext);

  useDropObstacle({ ref: obstacleRef, id });

  return (
    <div ref={obstacleRef} style={{ display: 'contents' }}>
      <AnimatePresence>
        {!(isNull(node) || isUndefined(node)) &&
          allowPositioning &&
          !allowAutomaticLayout && (
            <motion.div
              className="node-bucket"
              initial={{ opacity: 0, y: '100%' }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{ opacity: 0, y: '100%' }}
            >
              {node && (
                <motion.div
                  key={node[entityPrimaryKeyProperty] as string}
                  initial={{ opacity: 0, y: '100%' }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
                  exit={{ opacity: 0, y: '100%' }}
                >
                  <EnhancedNode
                    meta={() => ({ ...node, itemType: 'POSITIONED_NODE' })}
                    scrollDirection={NO_SCROLL}
                    size="xs"
                    {...node}
                  />
                </motion.div>
              )}
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

NodeBucket.displayName = 'NodeBucket';

export default NodeBucket;
