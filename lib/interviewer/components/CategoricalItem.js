import cx from 'classnames';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { Flipped } from 'react-flip-toolkit';
import { compose, withProps, withState } from 'recompose';
import { MarkdownLabel } from '~/lib/ui/components/Fields';
import { DropTarget, MonitorDropTarget } from '../behaviours/DragAndDrop';
import createSorter from '../utils/createSorter';
import NodeList from './NodeList';

/**
 * Renders a droppable CategoricalBin item
 */
const CategoricalItem = ({
  accentColor = 'black',
  details = '',
  id,
  isExpanded = false,
  isOver = false,
  label,
  nodes = [],
  onClick,
  onClickItem,
  sortOrder = [],
  willAccept = false,
}) => {
  const classNames = cx(
    'categorical-item',
    { 'categorical-item--hover': willAccept && isOver },
    { 'categorical-item--expanded': isExpanded },
  );

  const [sortedNodes] = useState(createSorter(sortOrder)(nodes));

  return (
    <Flipped flipId={id}>
      <div
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
                listId={`CATBIN_NODE_LIST_${label}`}
                id={`CATBIN_NODE_LIST_${label}`}
                onItemClick={onClickItem}
                items={sortedNodes}
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
  isOver: PropTypes.bool,
  label: PropTypes.string,
  nodes: PropTypes.array,
  onClick: PropTypes.func,
  onClickItem: PropTypes.func,
  sortOrder: PropTypes.array,
  willAccept: PropTypes.bool,
};

export default compose(
  withState('recentNode', 'setRecentNode', {}),
  withProps((props) => ({
    accepts: () => true,
    onDrop: ({ meta }) => {
      props.onDrop({ meta });
      props.setRecentNode(meta);
    },
  })),
  DropTarget,
  MonitorDropTarget(['isOver', 'willAccept']),
)(CategoricalItem);
