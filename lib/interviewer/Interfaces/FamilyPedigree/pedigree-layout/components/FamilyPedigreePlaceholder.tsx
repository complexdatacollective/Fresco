'use client';

import { motion } from 'motion/react';

/**
 * Decorative placeholder illustration shown on the FamilyPedigree interface
 * before the participant has started building their family pedigree. Renders a
 * ghost pedigree (squares and circles connected by lines) at low opacity to
 * preview what the completed tree will look like.
 *
 * Each stroke animates in sequentially with a hand-drawn drawing effect.
 * Uses Motion variants so the parent can orchestrate the animation by
 * toggling between "initial" and "animate" states.
 *
 * Layout (all positions derived from node centers):
 *
 *   Gen 1:   [Father]----[Mother]      y = 280
 *                   |
 *            ───────┼───────           y = 800
 *            |      |      |
 *   Gen 2:  (Sib)  [Ego]  (Sib)       y = 1100
 */

const BASE_DELAY = 0.15;

const draw = (delay: number) => ({
  initial: { pathLength: 0 },
  animate: {
    pathLength: 1,
    transition: {
      pathLength: {
        type: 'spring' as const,
        delay: BASE_DELAY + delay,
        // Increase damping to prevent overshoot (which causes weird visual glitches with lines)
        damping: 20,
      },
    },
  },
});

export default function FamilyPedigreePlaceholder({
  className,
}: {
  className?: string;
}) {
  // Node geometry (10x scale to avoid sub-pixel rounding errors)
  const r = 170; // circle radius & half side length for squares
  const d = r * 2; // node diameter / side length
  const rx = 100; // square corner radius

  // Node centers
  const father = { x: 1000, y: 280 };
  const mother = { x: 1800, y: 280 };
  const midX = (father.x + mother.x) / 2; // 1400
  const railY = 800;
  const child1 = { x: 600, y: 1100 }; // circle
  const ego = { x: 1400, y: 1100 }; // square (slightly brighter)
  const child3 = { x: 2200, y: 1100 }; // circle

  const stroke = 'var(--color-platinum)';
  const lineStroke = 'var(--color-platinum)';
  const sw = 25; // stroke width

  return (
    <motion.svg
      viewBox="0 0 2800 1450"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      initial="initial"
      animate="animate"
    >
      {/* --- Lines (behind nodes) --- */}
      {/* Partner line: right edge of father to left edge of mother */}
      <motion.line
        x1={father.x + r}
        y1={father.y}
        x2={mother.x - r}
        y2={mother.y}
        stroke={lineStroke}
        strokeWidth={sw}
        variants={draw(0.4)}
      />
      {/* Vertical from partner midpoint to sibling rail */}
      <motion.line
        x1={midX}
        y1={father.y}
        x2={midX}
        y2={railY}
        stroke={lineStroke}
        strokeWidth={sw}
        variants={draw(0.65)}
      />
      {/* Sibling rail */}
      <motion.line
        x1={child1.x}
        y1={railY}
        x2={child3.x}
        y2={railY}
        stroke={lineStroke}
        strokeWidth={sw}
        variants={draw(0.9)}
      />
      {/* Drop lines to children */}
      <motion.line
        x1={child1.x}
        y1={railY}
        x2={child1.x}
        y2={child1.y - r}
        stroke={lineStroke}
        strokeWidth={sw}
        variants={draw(1.15)}
      />
      <motion.line
        x1={ego.x}
        y1={railY}
        x2={ego.x}
        y2={ego.y - r}
        stroke={lineStroke}
        strokeWidth={sw}
        variants={draw(1.15)}
      />
      <motion.line
        x1={child3.x}
        y1={railY}
        x2={child3.x}
        y2={child3.y - r}
        stroke={lineStroke}
        strokeWidth={sw}
        variants={draw(1.15)}
      />

      {/* --- Nodes --- */}
      {/* Father (square) */}
      <motion.rect
        x={father.x - r}
        y={father.y - r}
        width={d}
        height={d}
        rx={rx}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        variants={draw(0)}
      />
      {/* Mother (circle) */}
      <motion.circle
        cx={mother.x}
        cy={mother.y}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        variants={draw(0.15)}
      />
      {/* Sibling left (circle) */}
      <motion.circle
        cx={child1.x}
        cy={child1.y}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        variants={draw(1.4)}
      />
      {/* Ego (square, slightly more visible) */}
      <motion.rect
        x={ego.x - r}
        y={ego.y - r}
        width={d}
        height={d}
        rx={rx}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        variants={draw(1.4)}
      />
      {/* Sibling right (circle) */}
      <motion.circle
        cx={child3.x}
        cy={child3.y}
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        variants={draw(1.4)}
      />
    </motion.svg>
  );
}
