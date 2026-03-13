'use client';

type KeyEntry = {
  label: string;
  strokeWidth: number;
  strokeDasharray?: string;
  opacity?: number;
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
];

const LINE_WIDTH = 48;
const LINE_Y = 10;

function KeyLine({ entry, color }: { entry: KeyEntry; color: string }) {
  const opacity = entry.opacity ?? 1;

  return (
    <svg width={LINE_WIDTH} height={20}>
      <line
        x1={0}
        y1={LINE_Y}
        x2={LINE_WIDTH}
        y2={LINE_Y}
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
