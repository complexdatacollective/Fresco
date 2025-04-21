import type { Codebook, NcNetwork } from '@codaco/shared-consts';
import { getCSSVariableAsString } from '~/lib/ui/utils/CSSVariables';

const NetworkVisualization = ({
  network,
  codebook,
}: {
  network: NcNetwork | null;
  codebook: Codebook | null;
}) => {
  if (!network || !codebook) {
    return <div className="text-xs">No interview data</div>;
  }

  const nodeTypeCount: Record<string, number> = {};
  network.nodes?.forEach((node) => {
    nodeTypeCount[node.type] = (nodeTypeCount[node.type] ?? 0) + 1;
  });

  const edgeTypeCount: Record<string, number> = {};
  network.edges?.forEach((edge) => {
    edgeTypeCount[edge.type] = (edgeTypeCount[edge.type] ?? 0) + 1;
  });

  if (
    Object.keys(nodeTypeCount).length === 0 &&
    Object.keys(edgeTypeCount).length === 0
  ) {
    return <div className="text-xs">No nodes or edges</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-8">
        {Object.entries(nodeTypeCount).map(([nodeType, count]) => {
          const color = getCSSVariableAsString(
            `--${codebook.node?.[nodeType]?.color ?? 'node-color-seq-1'}`,
          );
          const colorDark = getCSSVariableAsString(
            `--${codebook.node?.[nodeType]?.color ?? 'node-color-seq-1'}-dark`,
          );
          const nodeInfo = codebook.node?.[nodeType] ?? { name: 'Node' };

          return (
            <div key={nodeType} className="flex flex-col items-center">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{
                  background: `repeating-linear-gradient(
                    145deg,
                    ${color} 0%,
                    ${color} 50%,
                    ${colorDark} 50%,
                    ${colorDark} 100%
                  )`,
                }}
              >
                <span className="text-xs font-semibold text-white">
                  {count}
                </span>
              </div>
              <span className="pt-1 text-xs">{nodeInfo.name}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-12">
        {Object.entries(edgeTypeCount).map(([edgeType, count]) => {
          const color =
            getCSSVariableAsString(
              `--${codebook.edge?.[edgeType]?.color ?? 'edge-color-seq-1'}`,
            ) ?? '#E1B100';
          const colorDark =
            getCSSVariableAsString(
              `--${codebook.edge?.[edgeType]?.color ?? 'edge-color-seq-1'}-dark`,
            ) ?? '#A98600';
          const edgeInfo = codebook.edge?.[edgeType] ?? { name: 'Edge' };

          return (
            <div key={edgeType} className="flex flex-col items-center">
              <div className="flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 60 60"
                  width="24"
                  height="24"
                >
                  <g id="Links">
                    <circle cx="49" cy="11" r="11" fill={colorDark} />
                    <circle cx="49" cy="49" r="11" fill={colorDark} />
                    <circle cx="11" cy="30" r="11" fill={colorDark} />
                    <rect
                      x="25.3"
                      y="20.59"
                      width="4"
                      height="37.64"
                      transform="translate(-20.48 43.35) rotate(-60)"
                      fill={colorDark}
                    />
                    <rect
                      x="8.48"
                      y="18.59"
                      width="37.64"
                      height="4"
                      transform="translate(-6.64 16.41) rotate(-29.99)"
                      fill={colorDark}
                    />
                    <path
                      d="M3.22,22.22,18.78,37.78A11,11,0,1,1,3.22,22.22Z"
                      fill={color}
                    />
                    <path
                      d="M41.22,3.22,56.78,18.78A11,11,0,1,1,41.22,3.22Z"
                      fill={color}
                    />
                    <path
                      d="M41.22,41.22,56.78,56.78A11,11,0,1,1,41.22,41.22Z"
                      fill={color}
                    />
                  </g>
                </svg>
              </div>
              <span className="pt-1 text-xs">
                {edgeInfo.name} ({count})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NetworkVisualization;
