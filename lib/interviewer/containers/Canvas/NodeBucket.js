import { entityPrimaryKeyProperty } from '@codaco/shared-consts';
import { isNull, isUndefined } from 'lodash-es';
import { AnimatePresence, motion } from 'motion/react';
import PropTypes from 'prop-types';
import React, { useContext } from 'react';
import { compose } from 'recompose';
import { DragSource, DropObstacle } from '../../behaviours/DragAndDrop';
import { NO_SCROLL } from '../../behaviours/DragAndDrop/DragManager';
import Node from '../../components/Node';
import LayoutContext from '../../contexts/LayoutContext';
import { FIRST_LOAD_UI_ELEMENT_DELAY } from '../Interfaces/utils/constants';

const EnhancedNode = DragSource(Node);

const NodeBucket = React.forwardRef((props, ref) => {
  const { allowPositioning, node } = props;

  const { allowAutomaticLayout } = useContext(LayoutContext);

  return (
    <AnimatePresence>
      {!(isNull(node) || isUndefined(node)) &&
        allowPositioning &&
        !allowAutomaticLayout && (
          <motion.div
            className="node-bucket"
            ref={ref}
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
  );
});

NodeBucket.displayName = 'NodeBucket';

NodeBucket.propTypes = {
  allowPositioning: PropTypes.bool.isRequired,
};


export default compose(DropObstacle)(NodeBucket);
