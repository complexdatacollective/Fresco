import { type Prompt } from '@codaco/protocol-validation';
import { type NcNode } from '@codaco/shared-consts';
import cx from 'classnames';
import { useMemo } from 'react';
import { Flipped } from 'react-flip-toolkit';
import { compose, withProps } from 'recompose';
import { MarkdownLabel } from '~/lib/ui/components/Fields';
import { DropTarget, MonitorDropTarget } from '../behaviours/DragAndDrop';
import { usePrompts } from '../behaviours/withPrompt';
import { useNodeLabel } from '../Interfaces/Anonymisation/useNodeLabel';
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

type InnerCategoricalProps = CategoricalItemProps & {
  isOver?: boolean;
  willAccept?: boolean;
};

/**
 * Renders a droppable CategoricalBin item
 */
const CategoricalItem = ({
  accentColor = 'black',
  id,
  isExpanded = false,
  isOver = false,
  label,
  nodes = [],
  onClick,
  onClickItem,
  willAccept = false,
}: InnerCategoricalProps) => {
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

export default compose<InnerCategoricalProps, CategoricalItemProps>(
  withProps((props: CategoricalItemProps) => ({
    accepts: () => true,
    onDrop: ({ meta }: { meta: NcNode }) => {
      props.onDrop({ meta });
    },
  })),
  DropTarget,
  MonitorDropTarget(['isOver', 'willAccept']),
)(CategoricalItem);
