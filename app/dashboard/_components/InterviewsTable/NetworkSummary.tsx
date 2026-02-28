import { type Codebook } from '@codaco/protocol-validation';
import type { NcNetwork } from '@codaco/shared-consts';
import Node from '~/components/Node';
import { cx } from '~/utils/cva';

// TODO: Move to shared-consts or protocol-validation
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

type EdgeSummaryProps = {
  color: EdgeColorSequence;
  count: number;
  typeName: string;
};

function EdgeSummary({ color, count, typeName }: EdgeSummaryProps) {
  /**
   * There is a bug in the suggestCanonicalClasses rule: https://github.com/tailwindlabs/tailwindcss-intellisense/issues/1542
   */
  const edgeColorClasses = cx(
    color === 'edge-color-seq-1' &&
      // eslint-disable-next-line better-tailwindcss/enforce-canonical-classes
      '[--fill-dark:oklch(from_var(--color-edge-1)_calc(l_-_var(--dark-mod))_c_h)] [--fill:var(--color-edge-1)]',
    color === 'edge-color-seq-2' &&
      // eslint-disable-next-line better-tailwindcss/enforce-canonical-classes
      '[--fill-dark:oklch(from_var(--color-edge-2)_calc(l_-_var(--dark-mod))_c_h)] [--fill:var(--color-edge-2)]',
    color === 'edge-color-seq-3' &&
      // eslint-disable-next-line better-tailwindcss/enforce-canonical-classes
      '[--fill-dark:oklch(from_var(--color-edge-3)_calc(l_-_var(--dark-mod))_c_h)] [--fill:var(--color-edge-3)]',
    color === 'edge-color-seq-4' &&
      // eslint-disable-next-line better-tailwindcss/enforce-canonical-classes
      '[--fill-dark:oklch(from_var(--color-edge-4)_calc(l_-_var(--dark-mod))_c_h)] [--fill:var(--color-edge-4)]',
    color === 'edge-color-seq-5' &&
      // eslint-disable-next-line better-tailwindcss/enforce-canonical-classes
      '[--fill-dark:oklch(from_var(--color-edge-5)_calc(l_-_var(--dark-mod))_c_h)] [--fill:var(--color-edge-5)]',
    color === 'edge-color-seq-6' &&
      // eslint-disable-next-line better-tailwindcss/enforce-canonical-classes
      '[--fill-dark:oklch(from_var(--color-edge-6)_calc(l_-_var(--dark-mod))_c_h)] [--fill:var(--color-edge-6)]',
    color === 'edge-color-seq-7' &&
      // eslint-disable-next-line better-tailwindcss/enforce-canonical-classes
      '[--fill-dark:oklch(from_var(--color-edge-7)_calc(l_-_var(--dark-mod))_c_h)] [--fill:var(--color-edge-7)]',
    color === 'edge-color-seq-8' &&
      // eslint-disable-next-line better-tailwindcss/enforce-canonical-classes
      '[--fill-dark:oklch(from_var(--color-edge-8)_calc(l_-_var(--dark-mod))_c_h)] [--fill:var(--color-edge-8)]',
    color === 'edge-color-seq-9' &&
      // eslint-disable-next-line better-tailwindcss/enforce-canonical-classes
      '[--fill-dark:oklch(from_var(--color-edge-9)_calc(l_-_var(--dark-mod))_c_h)] [--fill:var(--color-edge-9)]',
  );

  return (
    <div className="flex flex-col items-center">
      <div className="flex size-8 items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 60 60"
          width="24"
          height="24"
          className={edgeColorClasses}
        >
          <g id="Links">
            <circle cx="49" cy="11" r="11" className="fill-(--fill-dark)" />
            <circle cx="49" cy="49" r="11" className="fill-(--fill-dark)" />
            <circle cx="11" cy="30" r="11" className="fill-(--fill-dark)" />
            <rect
              x="25.3"
              y="20.59"
              width="4"
              height="37.64"
              transform="translate(-20.48 43.35) rotate(-60)"
              className="fill-(--fill-dark)"
            />
            <rect
              x="8.48"
              y="18.59"
              width="37.64"
              height="4"
              transform="translate(-6.64 16.41) rotate(-29.99)"
              className="fill-(--fill-dark)"
            />
            <path
              d="M3.22,22.22,18.78,37.78A11,11,0,1,1,3.22,22.22Z"
              className="fill-(--fill)"
            />
            <path
              d="M41.22,3.22,56.78,18.78A11,11,0,1,1,41.22,3.22Z"
              className="fill-(--fill)"
            />
            <path
              d="M41.22,41.22,56.78,56.78A11,11,0,1,1,41.22,41.22Z"
              className="fill-(--fill)"
            />
          </g>
        </svg>
      </div>
      <span className="pt-1 text-xs">
        {typeName} ({count})
      </span>
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
    const nodeInfo = codebook.node?.[nodeType];

    return (
      <div className="flex flex-col items-center" key={nodeType}>
        <Node
          size="xxs"
          color={nodeInfo?.color}
          label={count.toLocaleString()}
        />
        <span className="pt-1 text-xs">{nodeInfo?.name ?? 'Unknown'}</span>
      </div>
    );
  });

  const edgeSummaries = Object.entries(
    network.edges?.reduce<Record<string, number>>((acc, edge) => {
      acc[edge.type] = (acc[edge.type] ?? 0) + 1;
      return acc;
    }, {}) ?? {},
  ).map(([edgeType, count]) => {
    const edgeInfo = codebook.edge?.[edgeType];

    if (!edgeInfo) return null;

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
    <div className="flex gap-2 py-2">
      {nodeSummaries}
      {edgeSummaries}
    </div>
  );
};

export default NetworkSummary;
