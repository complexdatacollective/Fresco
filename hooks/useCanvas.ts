import { useRef, useEffect } from 'react';

const resizeCanvas = (
  context: CanvasRenderingContext2D,
  canvasRef: React.RefObject<HTMLCanvasElement>,
) => {
  if (!canvasRef?.current) {
    return false;
  }

  const currentCanvas = canvasRef.current;

  const { width, height } = currentCanvas.getBoundingClientRect();
  const { devicePixelRatio: ratio = 1 } = window;

  if (
    currentCanvas.width !== width * ratio ||
    currentCanvas.height !== height * ratio
  ) {
    currentCanvas.width = width * ratio;
    currentCanvas.height = height * ratio;
    context.scale(ratio, ratio);
    return true;
  }

  return false;
};

type DrawFunction = (
  ctx: CanvasRenderingContext2D,
  time: number,
  canvasRef: React.RefObject<HTMLCanvasElement>,
) => void;

const defaultPredraw: DrawFunction = (context: CanvasRenderingContext2D) => {
  context.save();
  const { width, height } = context.canvas;
  context.clearRect(0, 0, width, height);
};

const defaultPostdraw: DrawFunction = (context: CanvasRenderingContext2D) => {
  context.restore();
};

const useCanvas = (
  draw: DrawFunction,
  predraw = defaultPredraw,
  postdraw = defaultPostdraw,
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    let requestAnimationId: number | null = null;

    const render = (ctx: CanvasRenderingContext2D, time: number) => {
      resizeCanvas(context, canvasRef);
      predraw(ctx, time, canvasRef);
      draw(ctx, time, canvasRef);
      postdraw(ctx, time, canvasRef);
      requestAnimationId = requestAnimationFrame((t) => render(ctx, t));
    };

    render(context, 0);

    return () => {
      if (requestAnimationId) {
        cancelAnimationFrame(requestAnimationId);
      }
    };
  });

  return canvasRef;
};

export default useCanvas;
