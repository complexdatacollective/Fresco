'use client';

const EDGE_WIDTH = 5;

type KeyEntry = {
  label: string;
  strokeWidth: number;
  strokeDasharray?: string;
  opacity?: number;
  double?: boolean;
  slash?: boolean;
};

const KEY_ENTRIES: KeyEntry[] = [
  { label: 'Parent', strokeWidth: 5 },
  {
    label: 'Biological parent',
    strokeWidth: 3,
    strokeDasharray: '8 4',
    opacity: 0.8,
  },
  {
    label: 'Egg or Sperm Donor',
    strokeWidth: 2,
    strokeDasharray: '2 4',
    opacity: 0.6,
  },
  {
    label: 'Surrogate Carrier',
    strokeWidth: 2,
    strokeDasharray: '2 4',
    opacity: 0.6,
  },
  { label: 'Partner (current)', strokeWidth: 5, double: true },
  { label: 'Partner (past)', strokeWidth: 5, double: true, slash: true },
];

const LINE_WIDTH = 48;
const LINE_Y = 10;
const DOUBLE_OFFSET = EDGE_WIDTH;

function KeyLine({ entry, color }: { entry: KeyEntry; color: string }) {
  const y = LINE_Y;
  const opacity = entry.opacity ?? 1;

  if (entry.double) {
    const midX = LINE_WIDTH / 2;
    const slashSize = DOUBLE_OFFSET * 2;
    return (
      <svg width={LINE_WIDTH} height={20}>
        <line
          x1={0}
          y1={y - DOUBLE_OFFSET}
          x2={LINE_WIDTH}
          y2={y - DOUBLE_OFFSET}
          stroke={color}
          strokeWidth={entry.strokeWidth}
          opacity={opacity}
        />
        <line
          x1={0}
          y1={y + DOUBLE_OFFSET}
          x2={LINE_WIDTH}
          y2={y + DOUBLE_OFFSET}
          stroke={color}
          strokeWidth={entry.strokeWidth}
          opacity={opacity}
        />
        {entry.slash && (
          <line
            x1={midX - slashSize / 2}
            y1={y + slashSize}
            x2={midX + slashSize / 2}
            y2={y - slashSize}
            stroke={color}
            strokeWidth={entry.strokeWidth}
          />
        )}
      </svg>
    );
  }

  return (
    <svg width={LINE_WIDTH} height={20}>
      <line
        x1={0}
        y1={y}
        x2={LINE_WIDTH}
        y2={y}
        stroke={color}
        strokeWidth={entry.strokeWidth}
        strokeDasharray={entry.strokeDasharray}
        strokeLinecap="round"
        opacity={opacity}
      />
    </svg>
  );
}

type PedigreeKeyProps = {
  color: string;
} & React.HTMLAttributes<HTMLDivElement>;

export default function PedigreeKey({ color, ...props }: PedigreeKeyProps) {
  return (
    <div {...props}>
      {KEY_ENTRIES.map((entry) => (
        <div key={entry.label} className="flex items-center gap-3">
          <KeyLine entry={entry} color={color} />
          <span className="text-sm">{entry.label}</span>
        </div>
      ))}
    </div>
  );
}
