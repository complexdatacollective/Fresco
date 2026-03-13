import { animate } from 'motion/react';
import { type RefObject, useCallback, useEffect, useRef } from 'react';

const PARTICLE_COUNT = 50;
const PARTICLE_ANGLES = Array.from(
  { length: PARTICLE_COUNT },
  (_, i) => (i / PARTICLE_COUNT) * Math.PI * 2,
);

type ParticleColor = (string & {}) | string[] | 'random';

const PARTICLE_SIZES = {
  small: 4,
  medium: 8,
  large: 12,
};

type UseCelebrateOptions = {
  particles?: boolean;
  particleColor?: ParticleColor;
  particleSize?: keyof typeof PARTICLE_SIZES;
};

const DEFAULT_OPTIONS: Required<UseCelebrateOptions> = {
  particles: true,
  particleColor: 'random',
  particleSize: 'medium',
};

const RANDOM_HUES = Array.from(
  { length: PARTICLE_COUNT },
  (_, i) => (i / PARTICLE_COUNT) * 360,
);

function resolveColor(color: ParticleColor | undefined, index: number): string {
  if (color === 'random') {
    const hue = RANDOM_HUES[index % RANDOM_HUES.length]!;
    return `oklch(0.75 0.2 ${String(hue)})`;
  }

  if (Array.isArray(color)) {
    return color[index % color.length]!;
  }

  return color ?? 'white';
}

export function useCelebrate(
  ref: RefObject<HTMLElement | null>,
  options?: UseCelebrateOptions,
): () => void {
  // Merge user options with defaults, and keep in a ref to avoid re-running effects
  const optionsRef = useRef({ ...DEFAULT_OPTIONS, ...options });

  const containersRef = useRef<Set<HTMLDivElement>>(new Set());

  useEffect(() => {
    const containers = containersRef.current;
    return () => {
      for (const container of containers) {
        container.remove();
      }
      containers.clear();
    };
  }, []);

  const celebrate = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    void animate(
      el,
      { scale: [0.8, 1] },
      { type: 'spring', stiffness: 500, damping: 12 },
    );

    if (!optionsRef.current?.particles) return;

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const halfW = rect.width / 2;
    const halfH = rect.height / 2;

    const container = document.createElement('div');
    Object.assign(container.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '50',
    });
    document.body.appendChild(container);
    containersRef.current.add(container);

    const opts = optionsRef.current;
    const baseSize = PARTICLE_SIZES[opts.particleSize];

    const particles = PARTICLE_ANGLES.map((angle, i) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Find distance from center to ellipse edge along this angle
      const edgeDist =
        halfW > 0 && halfH > 0
          ? (halfW * halfH) / Math.sqrt((halfH * cos) ** 2 + (halfW * sin) ** 2)
          : 0;

      const startX = centerX + cos * edgeDist;
      const startY = centerY + sin * edgeDist;

      const size = baseSize * (0.6 + Math.random() * 0.8);
      const div = document.createElement('div');
      Object.assign(div.style, {
        position: 'absolute',
        left: `${String(startX)}px`,
        top: `${String(startY)}px`,
        width: `${String(size)}px`,
        height: `${String(size)}px`,
        borderRadius: '50%',
        backgroundColor: resolveColor(opts.particleColor, i),
      });
      container.appendChild(div);

      const distance = 300 + Math.random() * 40;
      const x = cos * distance;
      const y = sin * distance;
      const duration = 0.6 + Math.random() * 0.5;

      return animate(
        div,
        { x: [0, x], y: [0, y], opacity: [1, 0], scale: [1, 0] },
        { duration, ease: 'easeOut' },
      ).finished;
    });

    void Promise.all(particles).then(() => {
      container.remove();
      containersRef.current.delete(container);
    });
  }, [ref]);

  return celebrate;
}
