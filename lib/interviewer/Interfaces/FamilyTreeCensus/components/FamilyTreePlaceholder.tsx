/**
 * Decorative placeholder illustration shown on the FamilyTreeCensus interface
 * before the participant has started building their family tree. Renders a
 * ghost pedigree (squares and circles connected by lines) at low opacity to
 * preview what the completed tree will look like.
 *
 * Layout (all positions derived from node centers):
 *
 *   Gen 1:   [Father]----[Mother]      y = 28
 *                   |
 *            ───────┼───────           y = 80
 *            |      |      |
 *   Gen 2:  (Sib)  [Ego]  (Sib)       y = 110
 */
export default function FamilyTreePlaceholder({
  className,
}: {
  className?: string;
}) {
  // Node geometry
  const r = 17; // circle radius & half side length for squares
  const d = r * 2; // node diameter / side length
  const rx = 10; // square corner radius

  // Node centers
  const father = { x: 100, y: 28 };
  const mother = { x: 180, y: 28 };
  const midX = (father.x + mother.x) / 2; // 140
  const railY = 80;
  const child1 = { x: 60, y: 110 }; // circle
  const ego = { x: 140, y: 110 }; // square (slightly brighter)
  const child3 = { x: 220, y: 110 }; // circle

  const stroke = 'var(--color-platinum)';
  const lineStroke = 'var(--color-platinum)';
  const sw = 2.5; // stroke width

  return (
    <svg
      viewBox="0 0 280 145"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* --- Lines (behind nodes) --- */}
      {/* Partner line: right edge of father to left edge of mother */}
      <line
        x1={father.x + r}
        y1={father.y}
        x2={mother.x - r}
        y2={mother.y}
        stroke={lineStroke}
        strokeWidth={sw}
      />
      {/* Vertical from partner midpoint to sibling rail */}
      <line
        x1={midX}
        y1={father.y}
        x2={midX}
        y2={railY}
        stroke={lineStroke}
        strokeWidth={sw}
      />
      {/* Sibling rail */}
      <line
        x1={child1.x}
        y1={railY}
        x2={child3.x}
        y2={railY}
        stroke={lineStroke}
        strokeWidth={sw}
      />
      {/* Drop lines to children */}
      <line
        x1={child1.x}
        y1={railY}
        x2={child1.x}
        y2={child1.y - r}
        stroke={lineStroke}
        strokeWidth={sw}
      />
      <line
        x1={ego.x}
        y1={railY}
        x2={ego.x}
        y2={ego.y - r}
        stroke={lineStroke}
        strokeWidth={sw}
      />
      <line
        x1={child3.x}
        y1={railY}
        x2={child3.x}
        y2={child3.y - r}
        stroke={lineStroke}
        strokeWidth={sw}
      />

      {/* --- Nodes --- */}
      {/* Father (square) */}
      <rect
        x={father.x - r}
        y={father.y - r}
        width={d}
        height={d}
        rx={rx}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
      />
      {/* Mother (circle) */}
      <circle
        cx={mother.x}
        cy={mother.y}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
      />
      {/* Sibling left (circle) */}
      <circle
        cx={child1.x}
        cy={child1.y}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
      />
      {/* Ego (square, slightly more visible) */}
      <rect
        x={ego.x - r}
        y={ego.y - r}
        width={d}
        height={d}
        rx={rx}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
      />
      {/* Sibling right (circle) */}
      <circle
        cx={child3.x}
        cy={child3.y}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
      />
    </svg>
  );
}
