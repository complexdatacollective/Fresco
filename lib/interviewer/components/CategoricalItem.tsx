import { type Prompt } from '@codaco/protocol-validation';
import { type NcNode } from '@codaco/shared-consts';
import cx from 'classnames';
import { useMemo } from 'react';
import { Flipped } from 'react-flip-toolkit';
import { useDropTarget } from '~/lib/dnd';
import { MarkdownLabel } from '~/lib/ui/components/Fields';
import { usePrompts } from '../behaviours/withPrompt';
import { useNodeLabel } from '../containers/Interfaces/Anonymisation/useNodeLabel';
import createSorter, { type ProcessedSortRule } from '../utils/createSorter';
import NodeList from './NodeList';

const Details = ({ nodes }: { nodes: NcNode[] }) => {
  const label = useNodeLabel(nodes[0]!);
  const count = nodes.length - 1;
  return (
    <h5>
      {label}
      {count > 0 ? ` and ${count} other${count > 1 ? 's' : ''}` : ''}
    </h5>
  );
};

type CategoricalItemProps = {
  id: string;
  label: string;
  accentColor: string;
  onDrop: (props: { meta: NcNode }) => void;
  onClick: () => void;
  onClickItem: (node: NcNode) => void;
  isExpanded: boolean;
  nodes: NcNode[];
};

/**
 * Renders a droppable CategoricalBin item
 */
const CategoricalItem = ({
  accentColor = 'black',
  id,
  isExpanded = false,
  label,
  nodes = [],
  onClick,
  onClickItem,
  onDrop,
}: CategoricalItemProps) => {
  const { dropProps, isOver, willAccept } = useDropTarget({
    id,
    accepts: ['node'],
    announcedName: `Category: ${label}`,
    onDrop: (metadata) => {
      onDrop({ meta: metadata as NcNode });
    },
  });
  const {
    prompt: { sortOrder },
  } = usePrompts<Prompt & { sortOrder: ProcessedSortRule[] }>();

  const classNames = cx(
    'categorical-item',
    { 'categorical-item--hover': willAccept && isOver },
    { 'categorical-item--expanded': isExpanded },
  );

  const sortedNodes = useMemo(
    () => createSorter(sortOrder)(nodes),
    [nodes, sortOrder],
  );
  return (
    <Flipped flipId={id}>
      <div
        {...dropProps}
        className={classNames}
        // @ts-expect-error need to update CSS global types
        style={{ '--categorical-item-color': accentColor }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <div className="categorical-item__disk" />
        <div className="categorical-item__inner">
          <Flipped inverseFlipId={id} scale>
            <div className="categorical-item__title">
              <h3>
                <MarkdownLabel inline label={label} />
              </h3>
              {!isExpanded && nodes.length > 0 && <Details nodes={nodes} />}
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

export default CategoricalItem;
