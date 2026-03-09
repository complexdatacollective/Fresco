import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useMemo } from 'react';
import { alignPedigree } from '~/lib/pedigree-layout/alignPedigree';
import { computeConnectors } from '~/lib/pedigree-layout/connectors';
import { computeScaling } from '~/lib/pedigree-layout/scaling';
import {
  type ParentConnection,
  type PedigreeConnectors,
  type PedigreeInput,
  type ScalingParams,
} from '~/lib/pedigree-layout/types';

const sp = (parentIndex: number): ParentConnection => ({
  parentIndex,
  edgeType: 'social-parent',
});

const donor = (parentIndex: number): ParentConnection => ({
  parentIndex,
  edgeType: 'donor',
});

const surrogate = (parentIndex: number): ParentConnection => ({
  parentIndex,
  edgeType: 'surrogate',
});

const coParent = (parentIndex: number): ParentConnection => ({
  parentIndex,
  edgeType: 'co-parent',
});

const bioParent = (parentIndex: number): ParentConnection => ({
  parentIndex,
  edgeType: 'bio-parent',
});

// ─── Pedigree data definitions ──────────────────────────────────────────────

const PEDIGREES: Record<string, { input: PedigreeInput; label: string }> = {
  'Nuclear Family': {
    label: 'Traditional two-parent family with three children',
    input: {
      id: ['Father', 'Mother', 'Alice', 'Bob', 'Carol'],
      sex: ['male', 'female', 'female', 'male', 'female'],
      gender: ['man', 'woman', 'woman', 'man', 'woman'],
      parents: [[], [], [sp(0), sp(1)], [sp(0), sp(1)], [sp(0), sp(1)]],
    },
  },
  'Three Generations': {
    label: 'Grandparents, parents, and grandchildren',
    input: {
      id: [
        'Grandpa A',
        'Grandma A',
        'Grandpa B',
        'Grandma B',
        'Father',
        'Mother',
        'Child 1',
        'Child 2',
      ],
      sex: [
        'male',
        'female',
        'male',
        'female',
        'male',
        'female',
        'male',
        'female',
      ],
      gender: ['man', 'woman', 'man', 'woman', 'man', 'woman', 'man', 'woman'],
      parents: [
        [],
        [],
        [],
        [],
        [sp(0), sp(1)],
        [sp(2), sp(3)],
        [sp(4), sp(5)],
        [sp(4), sp(5)],
      ],
    },
  },
  'Same-Sex Parents': {
    label: 'Two mothers with two children',
    input: {
      id: ['Mom A', 'Mom B', 'Daughter', 'Son'],
      sex: ['female', 'female', 'female', 'male'],
      gender: ['woman', 'woman', 'woman', 'man'],
      parents: [[], [], [sp(0), sp(1)], [sp(0), sp(1)]],
    },
  },
  'Same-Sex Fathers': {
    label: 'Two fathers with a child',
    input: {
      id: ['Dad A', 'Dad B', 'Child'],
      sex: ['male', 'male', 'female'],
      gender: ['man', 'man', 'woman'],
      parents: [[], [], [sp(0), sp(1)]],
    },
  },
  'Single Parent': {
    label: 'One parent raising two children alone',
    input: {
      id: ['Parent', 'Child 1', 'Child 2'],
      sex: ['female', 'male', 'female'],
      gender: ['woman', 'man', 'woman'],
      parents: [[], [sp(0)], [sp(0)]],
    },
  },
  'Single Parent with Donor': {
    label: 'Solo parent with sperm donor (dashed auxiliary line)',
    input: {
      id: ['Mother', 'Donor', 'Child'],
      sex: ['female', 'male', 'female'],
      gender: ['woman', 'man', 'woman'],
      parents: [[], [], [sp(0), donor(1)]],
    },
  },
  'Surrogacy Family': {
    label: 'Two fathers with a surrogate mother (dashed auxiliary line)',
    input: {
      id: ['Dad A', 'Dad B', 'Surrogate', 'Child'],
      sex: ['male', 'male', 'female', 'male'],
      gender: ['man', 'man', 'woman', 'man'],
      parents: [[], [], [], [sp(0), sp(1), surrogate(2)]],
    },
  },
  'Three Co-Parents': {
    label: 'Three parents sharing equal parenting responsibility',
    input: {
      id: ['Parent A', 'Parent B', 'Parent C', 'Child'],
      sex: ['female', 'female', 'male', 'male'],
      gender: ['woman', 'woman', 'man', 'man'],
      parents: [[], [], [], [sp(0), sp(1), coParent(2)]],
    },
  },
  'Blended Family': {
    label: 'Remarriage with children from both partnerships',
    input: {
      id: [
        'Parent A',
        'Ex-Partner',
        'New Partner',
        'Child (1st)',
        'Child (2nd)',
      ],
      sex: ['male', 'female', 'female', 'female', 'male'],
      gender: ['man', 'woman', 'woman', 'woman', 'man'],
      parents: [[], [], [], [sp(0), sp(1)], [sp(0), sp(2)]],
    },
  },
  'Adoptive + Bio Parents': {
    label: 'Child with both biological and adoptive parents',
    input: {
      id: ['Adoptive Mom', 'Adoptive Dad', 'Bio Mother', 'Child'],
      sex: ['female', 'male', 'female', 'male'],
      gender: ['woman', 'man', 'woman', 'man'],
      parents: [[], [], [], [sp(0), sp(1), bioParent(2)]],
    },
  },
  'Non-Binary Parent': {
    label: 'Non-binary parent and partner with children',
    input: {
      id: ['Alex (NB)', 'Jordan', 'Child 1', 'Child 2'],
      sex: ['unknown', 'female', 'male', 'female'],
      gender: ['non-binary', 'woman', 'man', 'woman'],
      parents: [[], [], [sp(0), sp(1)], [sp(0), sp(1)]],
    },
  },
};

// ─── SVG rendering ──────────────────────────────────────────────────────────

const COLORS = {
  node: {
    'man': '#6366f1', // indigo
    'woman': '#ec4899', // pink
    'non-binary': '#a855f7', // purple
    'transgender-man': '#818cf8', // indigo light
    'transgender-woman': '#f472b6', // pink light
    'genderqueer': '#c084fc', // purple light
    'agender': '#94a3b8', // slate
    'two-spirit': '#f59e0b', // amber
    'other': '#64748b', // gray
    'unknown': '#9ca3af', // gray
  },
  edge: {
    'social-parent': '#94a3b8',
    'co-parent': '#94a3b8',
    'donor': '#f59e0b',
    'surrogate': '#f59e0b',
    'bio-parent': '#38bdf8',
  },
  groupLine: '#94a3b8',
  text: '#e2e8f0',
};

const SHAPES: Record<string, 'circle' | 'rect' | 'diamond'> = {
  'man': 'rect',
  'woman': 'circle',
  'non-binary': 'diamond',
  'transgender-man': 'rect',
  'transgender-woman': 'circle',
  'genderqueer': 'diamond',
  'agender': 'diamond',
  'two-spirit': 'diamond',
  'other': 'diamond',
  'unknown': 'diamond',
};

function NodeShape({
  cx,
  cy,
  r,
  gender,
  label,
}: {
  cx: number;
  cy: number;
  r: number;
  gender: string;
  label: string;
}) {
  const shape = SHAPES[gender] ?? 'diamond';
  const fill = COLORS.node[gender as keyof typeof COLORS.node] ?? '#9ca3af';

  return (
    <g>
      {shape === 'circle' && (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={fill}
          stroke="#fff"
          strokeWidth={1.5}
        />
      )}
      {shape === 'rect' && (
        <rect
          x={cx - r}
          y={cy - r}
          width={r * 2}
          height={r * 2}
          rx={3}
          fill={fill}
          stroke="#fff"
          strokeWidth={1.5}
        />
      )}
      {shape === 'diamond' && (
        <polygon
          points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
          fill={fill}
          stroke="#fff"
          strokeWidth={1.5}
        />
      )}
      <text
        x={cx}
        y={cy + r + 14}
        textAnchor="middle"
        fill={COLORS.text}
        fontSize={11}
        fontFamily="sans-serif"
      >
        {label}
      </text>
    </g>
  );
}

function isValidSeg(seg: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    Number.isFinite(seg.x1) &&
    Number.isFinite(seg.y1) &&
    Number.isFinite(seg.x2) &&
    Number.isFinite(seg.y2)
  );
}

function ConnectorsSvg({
  connectors,
  scaling,
}: {
  connectors: PedigreeConnectors;
  scaling: ScalingParams;
}) {
  const sx = Number.isFinite(scaling.hScale) ? scaling.hScale : 1;
  const sy = Number.isFinite(scaling.vScale) ? scaling.vScale : 1;
  return (
    <g>
      {connectors.groupLines
        .filter((gl) => isValidSeg(gl.segment))
        .map((gl, i) => (
          <g key={`group-${String(i)}`}>
            <line
              x1={gl.segment.x1 * sx}
              y1={gl.segment.y1 * sy}
              x2={gl.segment.x2 * sx}
              y2={gl.segment.y2 * sy}
              stroke={COLORS.groupLine}
              strokeWidth={gl.double ? 2.5 : 1.5}
            />
            {gl.doubleSegment && (
              <line
                x1={gl.doubleSegment.x1 * sx}
                y1={gl.doubleSegment.y1 * sy}
                x2={gl.doubleSegment.x2 * sx}
                y2={gl.doubleSegment.y2 * sy}
                stroke={COLORS.groupLine}
                strokeWidth={1.5}
              />
            )}
          </g>
        ))}

      {connectors.parentChildLines.map((pc, i) => {
        const color =
          COLORS.edge[pc.edgeType as keyof typeof COLORS.edge] ??
          COLORS.groupLine;
        return (
          <g key={`pc-${String(i)}`}>
            {pc.uplines.map((seg, j) => (
              <line
                key={`up-${String(j)}`}
                x1={seg.x1 * sx}
                y1={seg.y1 * sy}
                x2={seg.x2 * sx}
                y2={seg.y2 * sy}
                stroke={color}
                strokeWidth={1}
              />
            ))}
            <line
              x1={pc.siblingBar.x1 * sx}
              y1={pc.siblingBar.y1 * sy}
              x2={pc.siblingBar.x2 * sx}
              y2={pc.siblingBar.y2 * sy}
              stroke={color}
              strokeWidth={1}
            />
            {pc.parentLink
              .filter((seg) => isValidSeg(seg))
              .map((seg, j) => (
                <line
                  key={`pl-${String(j)}`}
                  x1={seg.x1 * sx}
                  y1={seg.y1 * sy}
                  x2={seg.x2 * sx}
                  y2={seg.y2 * sy}
                  stroke={color}
                  strokeWidth={1}
                />
              ))}
          </g>
        );
      })}

      {connectors.auxiliaryLines.map((aux, i) => {
        const color =
          COLORS.edge[aux.edgeType as keyof typeof COLORS.edge] ?? '#f59e0b';
        return (
          <g key={`aux-${String(i)}`}>
            {aux.segments.map((seg, j) => (
              <line
                key={`seg-${String(j)}`}
                x1={seg.x1 * sx}
                y1={seg.y1 * sy}
                x2={seg.x2 * sx}
                y2={seg.y2 * sy}
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray="6 3"
              />
            ))}
          </g>
        );
      })}

      {connectors.duplicateArcs.map((arc, i) => {
        const d = arc.path.points
          .map((p, j) =>
            j === 0
              ? `M ${String(p.x * sx)} ${String(p.y * sy)}`
              : `L ${String(p.x * sx)} ${String(p.y * sy)}`,
          )
          .join(' ');
        return (
          <path
            key={`arc-${String(i)}`}
            d={d}
            fill="none"
            stroke={COLORS.groupLine}
            strokeWidth={1}
            strokeDasharray="4 2"
          />
        );
      })}
    </g>
  );
}

function PedigreeRenderer({
  input,
  label,
}: {
  input: PedigreeInput;
  label: string;
}) {
  const plotWidth = 600;
  const plotHeight = 400;
  const nodeRadius = 18;
  const padding = 40;

  const { layout, scaling, connectors } = useMemo(() => {
    const lay = alignPedigree(input);
    const rawScl = computeScaling(lay, plotWidth, plotHeight, 1, 20);
    // Guard against NaN/Infinity from degenerate layouts (e.g. single node)
    const safe = (v: number, fallback: number) =>
      Number.isFinite(v) ? v : fallback;
    const scl: ScalingParams = {
      boxWidth: safe(rawScl.boxWidth, 1),
      boxHeight: safe(rawScl.boxHeight, 0.5),
      legHeight: safe(rawScl.legHeight, 0.25),
      hScale: safe(rawScl.hScale, 1),
      vScale: safe(rawScl.vScale, 1),
    };
    const conn = computeConnectors(lay, scl, input.parents);
    return { layout: lay, scaling: scl, connectors: conn };
  }, [input]);

  const nodePositions = useMemo(() => {
    const positions: {
      key: string;
      x: number;
      y: number;
      id: string;
      gender: string;
    }[] = [];
    for (let lev = 0; lev < layout.nid.length; lev++) {
      for (let col = 0; col < (layout.n[lev] ?? 0); col++) {
        const personIdx = layout.nid[lev]![col]!;
        if (personIdx < 0) continue;
        const x = layout.pos[lev]![col]! * scaling.hScale;
        const y = lev * scaling.vScale;
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        positions.push({
          key: `${String(lev)}-${String(col)}`,
          x,
          y,
          id: input.id[personIdx] ?? `Person ${String(personIdx)}`,
          gender: input.gender[personIdx] ?? 'unknown',
        });
      }
    }
    return positions;
  }, [layout, scaling, input]);

  // Compute viewBox from actual positions
  const viewBox = useMemo(() => {
    if (nodePositions.length === 0)
      return `0 0 ${String(plotWidth)} ${String(plotHeight)}`;
    const xs = nodePositions.map((p) => p.x);
    const ys = nodePositions.map((p) => p.y);
    const minX = Math.min(...xs) - padding - nodeRadius;
    const minY = Math.min(...ys) - padding - nodeRadius;
    const maxX = Math.max(...xs) + padding + nodeRadius;
    const maxY = Math.max(...ys) + padding + nodeRadius + 20; // label space
    return `${String(minX)} ${String(minY)} ${String(maxX - minX)} ${String(maxY - minY)}`;
  }, [nodePositions]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p
        style={{
          color: '#94a3b8',
          fontSize: 13,
          margin: 0,
          fontFamily: 'sans-serif',
        }}
      >
        {label}
      </p>
      <svg
        viewBox={viewBox}
        style={{
          width: '100%',
          maxWidth: 700,
          height: 'auto',
          background: '#1e293b',
          borderRadius: 8,
        }}
      >
        <ConnectorsSvg connectors={connectors} scaling={scaling} />
        {nodePositions.map((pos) => (
          <NodeShape
            key={pos.key}
            cx={pos.x}
            cy={pos.y}
            r={nodeRadius}
            gender={pos.gender}
            label={pos.id}
          />
        ))}
      </svg>
    </div>
  );
}

// ─── Storybook meta ─────────────────────────────────────────────────────────

type StoryArgs = {
  pedigree: string;
};

function PedigreeStory({ pedigree }: StoryArgs) {
  const data = PEDIGREES[pedigree] ?? PEDIGREES['Nuclear Family']!;
  return <PedigreeRenderer input={data.input} label={data.label} />;
}

const meta: Meta<StoryArgs> = {
  title: 'Systems/PedigreeLayout',
  component: PedigreeStory,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'dark' },
    docs: { source: { type: 'code' } },
  },
  argTypes: {
    pedigree: {
      control: 'select',
      options: Object.keys(PEDIGREES),
    },
  },
  args: {
    pedigree: 'Nuclear Family',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Individual stories for each family configuration ───────────────────────

export const NuclearFamily: Story = {
  args: { pedigree: 'Nuclear Family' },
};

export const ThreeGenerations: Story = {
  args: { pedigree: 'Three Generations' },
};

export const SameSexMothers: Story = {
  args: { pedigree: 'Same-Sex Parents' },
};

export const SameSexFathers: Story = {
  args: { pedigree: 'Same-Sex Fathers' },
};

export const SingleParent: Story = {
  args: { pedigree: 'Single Parent' },
};

export const SingleParentWithDonor: Story = {
  args: { pedigree: 'Single Parent with Donor' },
};

export const SurrogacyFamily: Story = {
  args: { pedigree: 'Surrogacy Family' },
};

export const ThreeCoParents: Story = {
  args: { pedigree: 'Three Co-Parents' },
};

export const BlendedFamily: Story = {
  args: { pedigree: 'Blended Family' },
};

export const AdoptivePlusBioParents: Story = {
  args: { pedigree: 'Adoptive + Bio Parents' },
};

export const NonBinaryParent: Story = {
  args: { pedigree: 'Non-Binary Parent' },
};

function LegendItem({
  shape,
  color,
  label,
}: {
  shape: 'circle' | 'rect' | 'diamond';
  color: string;
  label: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width={20} height={20} viewBox="0 0 20 20">
        {shape === 'circle' && (
          <circle
            cx={10}
            cy={10}
            r={8}
            fill={color}
            stroke="#fff"
            strokeWidth={1}
          />
        )}
        {shape === 'rect' && (
          <rect
            x={2}
            y={2}
            width={16}
            height={16}
            rx={2}
            fill={color}
            stroke="#fff"
            strokeWidth={1}
          />
        )}
        {shape === 'diamond' && (
          <polygon
            points="10,2 18,10 10,18 2,10"
            fill={color}
            stroke="#fff"
            strokeWidth={1}
          />
        )}
      </svg>
      <span
        style={{ color: '#e2e8f0', fontSize: 12, fontFamily: 'sans-serif' }}
      >
        {label}
      </span>
    </div>
  );
}

function LegendLine({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width={24} height={12} viewBox="0 0 24 12">
        <line
          x1={0}
          y1={6}
          x2={24}
          y2={6}
          stroke={color}
          strokeWidth={2}
          strokeDasharray={dashed ? '4 2' : undefined}
        />
      </svg>
      <span
        style={{ color: '#e2e8f0', fontSize: 12, fontFamily: 'sans-serif' }}
      >
        {label}
      </span>
    </div>
  );
}

function AllConfigurations() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
        padding: 24,
        maxWidth: 800,
      }}
    >
      <div>
        <h2
          style={{
            color: '#f1f5f9',
            fontFamily: 'sans-serif',
            fontSize: 18,
            margin: '0 0 12px',
          }}
        >
          Legend
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '6px 24px',
            background: '#334155',
            padding: 12,
            borderRadius: 8,
          }}
        >
          <LegendItem shape="rect" color={COLORS.node.man} label="Man" />
          <LegendItem shape="circle" color={COLORS.node.woman} label="Woman" />
          <LegendItem
            shape="diamond"
            color={COLORS.node['non-binary']}
            label="Non-binary"
          />
          <LegendItem
            shape="diamond"
            color={COLORS.node.unknown}
            label="Unknown"
          />
          <LegendLine
            color={COLORS.groupLine}
            label="Parent group / child link"
          />
          <LegendLine
            color={COLORS.edge.donor}
            label="Donor / surrogate"
            dashed
          />
          <LegendLine
            color={COLORS.edge['bio-parent']}
            label="Biological parent"
            dashed
          />
        </div>
      </div>

      {Object.entries(PEDIGREES).map(([name, data]) => (
        <div key={name}>
          <h3
            style={{
              color: '#f1f5f9',
              fontFamily: 'sans-serif',
              fontSize: 15,
              margin: '0 0 4px',
            }}
          >
            {name}
          </h3>
          <PedigreeRenderer input={data.input} label={data.label} />
        </div>
      ))}
    </div>
  );
}

export const Gallery: Story = {
  render: () => <AllConfigurations />,
  args: { pedigree: 'Nuclear Family' },
  parameters: {
    layout: 'fullscreen',
  },
};
