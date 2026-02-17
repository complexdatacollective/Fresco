import { AnimatePresence, motion } from 'motion/react';
import {
  forwardRef,
  useCallback,
  useEffect,
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
  showLine: boolean;
  freezeLine: boolean;
  onLineFaded: () => void;
};

function AnnotationLine({
  line,
  showLine,
  freezeLine,
  onLineFaded,
}: AnnotationLineProps) {
  const pathData = `M ${line.map((p) => `${p.x} ${p.y}`).join(' L ')}`;

  if (freezeLine) {
    return (
      <path
        d={pathData}
        fill="none"
        stroke="white"
        strokeWidth="0.004"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  return (
    <AnimatePresence initial={false} onExitComplete={onLineFaded}>
      {showLine && (
        <motion.path
          d={pathData}
          fill="none"
          stroke="white"
          strokeWidth="0.004"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          exit={{ opacity: 0 }}
          transition={{
            duration: (3000 * Math.log10(line.length ** 2)) / 1000,
          }}
        />
      )}
    </AnimatePresence>
  );
}

const Annotations = forwardRef<AnnotationsHandle, AnnotationsProps>(
  function Annotations({ isFrozen, onChangeActiveAnnotations }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [lines, setLines] = useState<Point[][]>([]);
    const [linesShowing, setLinesShowing] = useState<boolean[]>([]);
    const [linesToFade, setLinesToFade] = useState<boolean[]>([]);
    const activeLinesRef = useRef(0);
    const [isDrawing, setIsDrawing] = useState(false);
    const removeLineTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const isFrozenRef = useRef(isFrozen);

    useEffect(() => {
      isFrozenRef.current = isFrozen;
    }, [isFrozen]);

    // Handle freeze/unfreeze transitions
    useEffect(() => {
      if (isFrozen) {
        // Freeze: clear all pending fade timers
        for (const timer of removeLineTimersRef.current) {
          clearTimeout(timer);
        }
        removeLineTimersRef.current = [];
      } else {
        // Unfreeze: start fading all currently showing lines
        setLinesShowing((current) => {
          setLinesToFade([...current]);

          current.forEach((showing, index) => {
            if (showing) {
              removeLineTimersRef.current.push(
                setTimeout(() => {
                  setLinesToFade((prev) => {
                    const next = [...prev];
                    next[index] = false;
                    return next;
                  });
                }, 1000),
              );
            }
          });

          return current;
        });
      }
    }, [isFrozen]);

    // Cleanup timers on unmount
    useEffect(() => {
      return () => {
        for (const timer of removeLineTimersRef.current) {
          clearTimeout(timer);
        }
      };
    }, []);

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
        setLines((prev) => [...prev, [point]]);
        setLinesShowing((prev) => [...prev, true]);
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
      if (isFrozenRef.current) return;

      setLines((currentLines) => {
        const lineIndex = currentLines.length - 1;
        removeLineTimersRef.current.push(
          setTimeout(() => {
            setLinesToFade((prev) => {
              const next = [...prev];
              next[lineIndex] = false;
              return next;
            });
          }, 1000),
        );
        return currentLines;
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
        setIsDrawing(false);
        for (const timer of removeLineTimersRef.current) {
          clearTimeout(timer);
        }
        removeLineTimersRef.current = [];
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
            const showLine =
              (isDrawing && index === lines.length - 1) || !!linesToFade[index];
            const freezeLine = isFrozen && !!linesShowing[index];

            return (
              <AnnotationLine
                key={index}
                line={line}
                showLine={showLine}
                freezeLine={freezeLine}
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
