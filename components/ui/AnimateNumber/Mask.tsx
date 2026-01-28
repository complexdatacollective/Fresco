'use client';

import { type ReactNode, type CSSProperties } from 'react';
import { addScaleCorrector, motion } from 'motion/react';

export const maskHeight = 'var(--mask-height, 0.15em)';
const maskWidth = 'var(--mask-width, 0.5em)';
const correctedMaskWidth = `calc(${maskWidth} / var(--invert-x, 1))`;
const cornerGradient = `#000 0, transparent 71%`;

const mask =
  `linear-gradient(to right, transparent 0, #000 ${correctedMaskWidth}, #000 calc(100% - ${correctedMaskWidth}), transparent),` +
  `linear-gradient(to bottom, transparent 0, #000 ${maskHeight}, #000 calc(100% - ${maskHeight}), transparent 100%),` +
  `radial-gradient(at bottom right, ${cornerGradient}),` +
  `radial-gradient(at bottom left, ${cornerGradient}), ` +
  `radial-gradient(at top left, ${cornerGradient}), ` +
  `radial-gradient(at top right, ${cornerGradient})`;

const maskSize =
  `100% calc(100% - ${maskHeight} * 2),` +
  `calc(100% - ${correctedMaskWidth} * 2) 100%,` +
  `${correctedMaskWidth} ${maskHeight},` +
  `${correctedMaskWidth} ${maskHeight},` +
  `${correctedMaskWidth} ${maskHeight},` +
  `${correctedMaskWidth} ${maskHeight}`;

// Type assertion needed for motion's addScaleCorrector API

(addScaleCorrector as (correctors: Record<string, unknown>) => void)({
  '--invert-x': {
    correct: (
      _latest: number,
      {
        treeScale,
        projectionDelta,
      }: {
        treeScale?: { x: number };
        projectionDelta?: { x: { scale: number } };
      },
    ) => (projectionDelta?.x.scale ?? 1) * (treeScale?.x ?? 1),
  },
});

type MaskProps = {
  children: ReactNode;
  layoutDependency?: unknown;
};

export function Mask({ children, layoutDependency }: MaskProps) {
  return (
    <motion.span
      layout
      layoutDependency={layoutDependency}
      aria-hidden
      style={
        {
          'display': 'inline-flex',
          '--invert-x': 1,
          'margin': `0 calc(-1*${maskWidth})`,
          'padding': `calc(${maskHeight}/2) ${maskWidth}`,
          'position': 'relative',
          'zIndex': -1,
          'overflow': 'clip',
          'WebkitMaskImage': mask,
          'WebkitMaskSize': maskSize,
          'WebkitMaskPosition':
            'center, center, top left, top right, bottom right, bottom left',
          'WebkitMaskRepeat': 'no-repeat',
        } as CSSProperties
      }
    >
      {children}
    </motion.span>
  );
}
