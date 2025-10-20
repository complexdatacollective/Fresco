import { type Codebook } from '@codaco/protocol-validation';
import type { NcNetwork } from '@codaco/shared-consts';
import { type NodeColorSequence } from '~/lib/ui/components/Node';

import { cx } from '~/utils/cva';

type EdgeColorSequence =
  | 'edge-color-seq-1'
  | 'edge-color-seq-2'
  | 'edge-color-seq-3'
  | 'edge-color-seq-4'
  | 'edge-color-seq-5'
  | 'edge-color-seq-6'
  | 'edge-color-seq-7'
  | 'edge-color-seq-8'
  | 'edge-color-seq-9';

type NodeSummaryProps = {
  color: NodeColorSequence;
  count: number;
  typeName: string;
};

type EdgeSummaryProps = {
  color: EdgeColorSequence;
  count: number;
  typeName: string;
};
function NodeSummary({ color, count, typeName }: NodeSummaryProps) {
  const classes = cx(
    'flex items-center h-8 w-8 justify-center rounded-full',
    'bg-linear-145 from-50% to-50%',
    'from-[var(--node-color-seq-1)] to-[var(--node-color-seq-1-dark)]',
    color === 'node-color-seq-1' &&
      'from-[var(--node-color-seq-1)] to-[var(--node-color-seq-1-dark)]',
    color === 'node-color-seq-2' &&
      'from-[var(--node-color-seq-2)] to-[var(--node-color-seq-2-dark)]',
    color === 'node-color-seq-3' &&
      'from-[var(--node-color-seq-3)] to-[var(--node-color-seq-3-dark)]',
    color === 'node-color-seq-4' &&
      'from-[var(--node-color-seq-4)] to-[var(--node-color-seq-4-dark)]',
    color === 'node-color-seq-5' &&
      'from-[var(--node-color-seq-5)] to-[var(--node-color-seq-5-dark)]',
    color === 'node-color-seq-6' &&
      'from-[var(--node-color-seq-6)] to-[var(--node-color-seq-6-dark)]',
    color === 'node-color-seq-7' &&
      'from-[var(--node-color-seq-7)] to-[var(--node-color-seq-7-dark)]',
    color === 'node-color-seq-8' &&
      'from-[var(--node-color-seq-8)] to-[var(--node-color-seq-8-dark)]',
  );

  return (
    <div className="flex flex-col items-center">
      <div className={classes}>
        <span className="text-xs font-semibold text-white">{count}</span>
      </div>
      <span className="pt-1 text-xs">{typeName}</span>
    </div>
  );
}
function EdgeSummary({ color, count, typeName }: EdgeSummaryProps) {
  const lightColorClass = cx(
    'fill-[var(--edge-color-seq-1)]',
    color === 'edge-color-seq-1' && 'fill-[var(--edge-color-seq-1)]',
    color === 'edge-color-seq-2' && 'fill-[var(--edge-color-seq-2)]',
    color === 'edge-color-seq-3' && 'fill-[var(--edge-color-seq-3)]',
    color === 'edge-color-seq-4' && 'fill-[var(--edge-color-seq-4)]',
    color === 'edge-color-seq-5' && 'fill-[var(--edge-color-seq-5)]',
    color === 'edge-color-seq-6' && 'fill-[var(--edge-color-seq-6)]',
    color === 'edge-color-seq-7' && 'fill-[var(--edge-color-seq-7)]',
    color === 'edge-color-seq-8' && 'fill-[var(--edge-color-seq-8)]',
    color === 'edge-color-seq-9' && 'fill-[var(--edge-color-seq-9)]',
  );

  const darkColorClass = cx(
    'fill-[var(--edge-color-seq-1-dark)]',
    color === 'edge-color-seq-1' && 'fill-[var(--edge-color-seq-1-dark)]',
    color === 'edge-color-seq-2' && 'fill-[var(--edge-color-seq-2-dark)]',
    color === 'edge-color-seq-3' && 'fill-[var(--edge-color-seq-3-dark)]',
    color === 'edge-color-seq-4' && 'fill-[var(--edge-color-seq-4-dark)]',
    color === 'edge-color-seq-5' && 'fill-[var(--edge-color-seq-5-dark)]',
    color === 'edge-color-seq-6' && 'fill-[var(--edge-color-seq-6-dark)]',
    color === 'edge-color-seq-7' && 'fill-[var(--edge-color-seq-7-dark)]',
    color === 'edge-color-seq-8' && 'fill-[var(--edge-color-seq-8-dark)]',
    color === 'edge-color-seq-9' && 'fill-[var(--edge-color-seq-9-dark)]',
  );

  return (
    <div className="flex shrink-0 flex-col items-center">
      <div className="flex h-8 w-8 shrink-0 grow-0 items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 60 60"
          className="aspect-square h-full w-full"
        >
          <g id="Links">
            <circle cx="49" cy="11" r="11" className={darkColorClass} />
            <circle cx="49" cy="49" r="11" className={darkColorClass} />
            <circle cx="11" cy="30" r="11" className={darkColorClass} />
            <rect
              x="25.3"
              y="20.59"
              width="4"
              height="37.64"
              transform="translate(-20.48 43.35) rotate(-60)"
              className={darkColorClass}
            />
            <rect
              x="8.48"
              y="18.59"
              width="37.64"
              height="4"
              transform="translate(-6.64 16.41) rotate(-29.99)"
              className={darkColorClass}
            />
            <path
              d="M3.22,22.22,18.78,37.78A11,11,0,1,1,3.22,22.22Z"
              className={lightColorClass}
            />
            <path
              d="M41.22,3.22,56.78,18.78A11,11,0,1,1,41.22,3.22Z"
              className={lightColorClass}
            />
            <path
              d="M41.22,41.22,56.78,56.78A11,11,0,1,1,41.22,41.22Z"
              className={lightColorClass}
            />
          </g>
        </svg>
      </div>
      <div className="pt-1 text-xs">
        {typeName} ({count})
      </div>
    </div>
  );
}

const NetworkSummary = ({
  network,
  codebook,
}: {
  network: NcNetwork | null;
  codebook: Codebook | null;
}) => {
  if (!network || !codebook) {
    return <div className="text-xs">No interview data</div>;
  }
  const nodeSummaries = Object.entries(
    network.nodes?.reduce<Record<string, number>>((acc, node) => {
      acc[node.type] = (acc[node.type] ?? 0) + 1;
      return acc;
    }, {}) ?? {},
  ).map(([nodeType, count]) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    const nodeInfo = codebook.node?.[nodeType]!;
    return (
      <NodeSummary
        key={nodeType}
        color={nodeInfo.color}
        count={count}
        typeName={nodeInfo.name}
      />
    );
  });

  const edgeSummaries = Object.entries(
    network.edges?.reduce<Record<string, number>>((acc, edge) => {
      acc[edge.type] = (acc[edge.type] ?? 0) + 1;
      return acc;
    }, {}) ?? {},
  ).map(([edgeType, count]) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
    const edgeInfo = codebook.edge?.[edgeType]!;
    return (
      <EdgeSummary
        key={edgeType}
        color={edgeInfo.color as EdgeColorSequence}
        count={count}
        typeName={edgeInfo.name}
      />
    );
  });

  if (nodeSummaries.length === 0 && edgeSummaries.length === 0) {
    return <div className="text-xs">No nodes or edges</div>;
  }

  return (
    <div className="flex gap-2">
      {nodeSummaries}
      {edgeSummaries}
    </div>
  );
};

export default NetworkSummary;
