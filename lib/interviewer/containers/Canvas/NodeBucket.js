import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { isNull, isUndefined } from 'es-toolkit';
import { AnimatePresence, motion } from 'motion/react';
import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import { DragSource } from '../../behaviours/DragAndDrop/DragSource';
import { DropObstacle } from '../../behaviours/DragAndDrop/DropObstacle';
import { NO_SCROLL } from '../../behaviours/DragAndDrop/DragManager';
import Node from '../../components/Node';
import LayoutContext from '../../contexts/LayoutContext';
import { FIRST_LOAD_UI_ELEMENT_DELAY } from '../Interfaces/utils/constants';

const EnhancedNode = ({ meta, scrollDirection, ...nodeProps }) => {
  return (
    <DragSource
      meta={meta}
      scrollDirection={scrollDirection}
    >
      {(nodeRef, _dragState) => (
        <Node
          ref={nodeRef}
          {...nodeProps}
        />
      )}
    </DragSource>
  );
};

const NodeBucket = React.forwardRef((props, ref) => {
  const { allowPositioning, node, id = 'node-bucket' } = props;

  const { allowAutomaticLayout } = useContext(LayoutContext);

  return (
    <DropObstacle id={id}>
      {(obstacleRef) => (
        <AnimatePresence>
          {!(isNull(node) || isUndefined(node)) &&
            allowPositioning &&
            !allowAutomaticLayout && (
              <motion.div
                className="node-bucket"
                ref={(element) => {
                  // Forward both refs
                  if (ref) {
                    if (typeof ref === 'function') ref(element);
                    else ref.current = element;
                  }
                  if (obstacleRef) {
                    obstacleRef.current = element;
                  }
                }}
                initial={{ opacity: 0, y: '100%' }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: FIRST_LOAD_UI_ELEMENT_DELAY },
                }}
                exit={{ opacity: 0, y: '100%' }}
              >
                {node && (
                  <motion.div
                    key={node[entityPrimaryKeyProperty]}
                    initial={{ opacity: 0, y: '100%' }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
                    exit={{ opacity: 0, y: '100%' }}
                  >
                    <EnhancedNode
                      meta={() => ({ ...node, itemType: 'POSITIONED_NODE' })}
                      scrollDirection={NO_SCROLL}
                      {...node}
                    />
                  </motion.div>
                )}
              </motion.div>
            )}
        </AnimatePresence>
      )}
    </DropObstacle>
  );
});

NodeBucket.displayName = 'NodeBucket';

NodeBucket.propTypes = {
  allowPositioning: PropTypes.bool.isRequired,
  id: PropTypes.string,
};

export default NodeBucket;
