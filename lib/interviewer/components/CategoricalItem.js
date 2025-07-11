import React from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import { Flipped } from 'react-flip-toolkit';
import { MarkdownLabel } from '~/lib/ui/components/Fields';
import { useDropTarget } from '../behaviours/DragAndDrop/DropTarget';
import { useDropTargetMonitor } from '../behaviours/DragAndDrop/MonitorDropTarget';
import NodeList from './NodeList';

/**
 * Renders a droppable CategoricalBin item
 */
const CategoricalItem = ({
  accentColor = 'black',
  details = '',
  id,
  isExpanded = false,
  label,
  nodes = [],
  onClick,
  onClickItem,
  onDrop,
  sortOrder = [],
  stage,
}) => {
  const handleDrop = ({ meta }) => {
    onDrop({ meta });
  };

  const { elementRef } = useDropTarget({
    id,
    accepts: () => true,
    onDrop: handleDrop,
  });

  const monitorState = useDropTargetMonitor(id);

  const classNames = cx(
    'categorical-item',
    { 'categorical-item--hover': monitorState.willAccept && monitorState.isOver },
    { 'categorical-item--expanded': isExpanded },
  );

  return (
    <Flipped flipId={id}>
      <div
        ref={elementRef}
        className={classNames}
        style={{ '--categorical-item-color': accentColor }}
        onClick={onClick}
      >
        <div className="categorical-item__disk" />
        <div className="categorical-item__inner">
          <Flipped inverseFlipId={id} scale>
            <div className="categorical-item__title">
              <h3>
                <MarkdownLabel inline label={label} />
              </h3>
              {!isExpanded && details && (
                <h5>
                  <MarkdownLabel inline label={details} />
                </h5>
              )}
            </div>
          </Flipped>
          {isExpanded && (
            <div className="categorical-item__content">
              <NodeList
                stage={stage}
                listId={`CATBIN_NODE_LIST_${label}`}
                id={`CATBIN_NODE_LIST_${label}`}
                onItemClick={onClickItem}
                items={nodes}
                sortOrder={sortOrder}
              />
            </div>
          )}
        </div>
      </div>
    </Flipped>
  );
};

CategoricalItem.propTypes = {
  accentColor: PropTypes.string,
  details: PropTypes.string,
  id: PropTypes.string.isRequired,
  isExpanded: PropTypes.bool,
  label: PropTypes.string,
  nodes: PropTypes.array,
  onClick: PropTypes.func,
  onClickItem: PropTypes.func,
  onDrop: PropTypes.func.isRequired,
  sortOrder: PropTypes.array,
  stage: PropTypes.object,
};

export default CategoricalItem;
