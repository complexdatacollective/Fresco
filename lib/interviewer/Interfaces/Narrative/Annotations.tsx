import { motion } from 'motion/react';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

type Point = { x: number; y: number };

type AnnotationsHandle = {
  reset: () => void;
};

type AnnotationsProps = {
  isFrozen: boolean;
  onChangeActiveAnnotations: (active: boolean) => void;
};

type AnnotationLineProps = {
  line: Point[];
  isFading: boolean;
  onLineFaded: () => void;
};

function AnnotationLine({ line, isFading, onLineFaded }: AnnotationLineProps) {
  const pathData = `M ${line.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
  const fadeDuration = 3 * Math.log10(Math.max(line.length, 2) ** 2);

  return (
    <motion.path
      d={pathData}
      fill="none"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      animate={{ opacity: isFading ? 0 : 1 }}
      transition={{ duration: isFading ? fadeDuration : 0 }}
      onAnimationComplete={() => {
        if (isFading) onLineFaded();
      }}
    />
  );
}

const Annotations = forwardRef<AnnotationsHandle, AnnotationsProps>(
  function Annotations({ isFrozen, onChangeActiveAnnotations }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [lines, setLines] = useState<Point[][]>([]);
    const [linesShowing, setLinesShowing] = useState<boolean[]>([]);
    const [linesToFade, setLinesToFade] = useState<boolean[]>([]);
    const activeLinesRef = useRef(0);
    const activeLineIndexRef = useRef(-1);
    const [isDrawing, setIsDrawing] = useState(false);

    const relativeCoords = useCallback(
      (clientX: number, clientY: number): Point => {
        const el = containerRef.current;
        if (!el) return { x: 0, y: 0 };
        const rect = el.getBoundingClientRect();
        return {
          x: (clientX - rect.left) / rect.width,
          y: (clientY - rect.top) / rect.height,
        };
      },
      [],
    );

    const handlePointerDown = useCallback(
      (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        e.preventDefault();

        const point = relativeCoords(e.clientX, e.clientY);
        setLines((prev) => {
          activeLineIndexRef.current = prev.length;
          return [...prev, [point]];
        });
        setLinesShowing((prev) => [...prev, true]);
        setLinesToFade((prev) => [...prev, false]);
        activeLinesRef.current += 1;
        setIsDrawing(true);
        onChangeActiveAnnotations(true);
      },
      [relativeCoords, onChangeActiveAnnotations],
    );

    const handlePointerMove = useCallback(
      (e: React.PointerEvent) => {
        if (!isDrawing) return;
        const point = relativeCoords(e.clientX, e.clientY);
        setLines((prev) => {
          const next = [...prev];
          const lastLine = next[next.length - 1];
          if (lastLine) {
            next[next.length - 1] = [...lastLine, point];
          }
          return next;
        });
      },
      [isDrawing, relativeCoords],
    );

    const handlePointerUp = useCallback(() => {
      setIsDrawing(false);

      const lineIndex = activeLineIndexRef.current;
      setLinesToFade((prev) => {
        const next = [...prev];
        next[lineIndex] = true;
        return next;
      });
    }, []);

    const handleLineFaded = useCallback(
      (index: number) => {
        setLinesShowing((prev) => {
          const next = [...prev];
          next[index] = false;
          return next;
        });
        activeLinesRef.current -= 1;
        if (activeLinesRef.current === 0) {
          onChangeActiveAnnotations(false);
        }
      },
      [onChangeActiveAnnotations],
    );

    useImperativeHandle(ref, () => ({
      reset: () => {
        setLines([]);
        setLinesShowing([]);
        setLinesToFade([]);
        activeLinesRef.current = 0;
        activeLineIndexRef.current = -1;
        setIsDrawing(false);
        onChangeActiveAnnotations(false);
      },
    }));

    return (
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <svg
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 size-full"
        >
          {lines.map((line, index) => {
            if (!linesShowing[index]) return null;

            const isFading = !!linesToFade[index] && !isFrozen;

            return (
              <AnnotationLine
                key={index}
                line={line}
                isFading={isFading}
                onLineFaded={() => handleLineFaded(index)}
              />
            );
          })}
        </svg>
      </div>
    );
  },
);

export type { AnnotationsHandle };
export default Annotations;
