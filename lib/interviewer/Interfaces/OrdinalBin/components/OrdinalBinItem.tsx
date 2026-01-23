import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import color from 'color';
import { memo, useMemo } from 'react';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Heading from '~/components/typography/Heading';
import { useDropTarget } from '~/lib/dnd';
import { getCSSVariableAsString } from '~/lib/legacy-ui/utils/CSSVariables';
import { getEntityAttributes } from '~/lib/network-exporters/utils/general';
import { cx } from '~/utils/cva';
import NodeList from '../../../components/NodeList';
import { updateNode } from '../../../ducks/modules/session';
import { useAppDispatch } from '../../../store';
import createSorter, {
  type ProcessedSortRule,
} from '../../../utils/createSorter';
import { type OrdinalBinItem as OrdinalBinItemType } from '../useOrdinalBins';

type OrdinalBinItemProps = {
  bin: OrdinalBinItemType;
  index: number;
  activePromptVariable: string;
  stageId: string;
  promptId: string;
  sortOrder?: ProcessedSortRule[];
  promptColor: ReturnType<typeof color>;
  backgroundColor: ReturnType<typeof color>;
  totalBins: number;
};

const OrdinalBinItem = memo((props: OrdinalBinItemProps) => {
  const {
    bin,
    index,
    activePromptVariable,
    stageId,
    promptId,
    sortOrder = [],
    promptColor,
    backgroundColor,
    totalBins,
  } = props;

  const dispatch = useAppDispatch();

  const missingValue = bin.value < 0;

  const accentColor = useMemo(() => {
    if (missingValue) {
      return color(getCSSVariableAsString('--color-rich-black'))
        .mix(backgroundColor, 0.8)
        .toString();
    }
    const blendRatio = (1 / totalBins) * index;
    return promptColor.mix(backgroundColor, blendRatio).toString();
  }, [missingValue, backgroundColor, totalBins, index, promptColor]);

  const panelColor = useMemo(() => {
    if (missingValue) {
      return color(getCSSVariableAsString('--color-rich-black'))
        .mix(backgroundColor, 0.9)
        .toString();
    }
    const blendRatio = (1 / totalBins) * index;
    return color(getCSSVariableAsString('--nc-panel-bg-muted'))
      .mix(backgroundColor, blendRatio)
      .toString();
  }, [missingValue, backgroundColor, totalBins, index]);

  const handleDrop = (metadata?: Record<string, unknown>) => {
    const meta = metadata as NcNode | undefined;
    if (!meta) return;

    if (getEntityAttributes(meta)[activePromptVariable] === bin.value) {
      return;
    }

    void dispatch(
      updateNode({
        nodeId: meta[entityPrimaryKeyProperty],
        newAttributeData: { [activePromptVariable]: bin.value },
      }),
    );
  };

  const sorter = useMemo(() => createSorter<NcNode>(sortOrder), [sortOrder]);
  const sortedNodes = sorter(bin.nodes);

  const listId = `ORDBIN_NODE_LIST_${stageId}_${promptId}_${index}`;

  const { dropProps, isOver, willAccept, isDragging } = useDropTarget({
    id: listId,
    accepts: ['node'],
    announcedName: `Ordinal bin for ${bin.label}`,
    onDrop: handleDrop,
  });

  const contentClassNames = cx(
    'flex flex-1 grow-[5] flex-col items-center overflow-hidden p-2 transition-colors duration-200',
    isDragging && willAccept && 'ring-accent ring-2 ring-inset',
    isOver && willAccept && 'bg-success',
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col" key={index}>
      <div
        className="flex min-h-14 items-center justify-center px-2 text-center"
        style={{ background: accentColor }}
      >
        <Heading level="h4" variant="default" margin="none">
          <RenderMarkdown>{bin.label}</RenderMarkdown>
        </Heading>
      </div>
      <div
        {...dropProps}
        className={contentClassNames}
        style={{
          borderBottomColor: accentColor,
          background: isOver && willAccept ? undefined : panelColor,
        }}
      >
        <NodeList id={listId} items={sortedNodes} nodeSize="sm" />
      </div>
    </div>
  );
});

OrdinalBinItem.displayName = 'OrdinalBinItem';

export default OrdinalBinItem;
