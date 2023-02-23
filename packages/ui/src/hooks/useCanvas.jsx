import { useRef, useEffect } from 'react';

const resizeCanvas = (
  context,
  _,
  { current: currentCanvas },
) => { /* eslint-disable no-param-reassign */
  const { width, height } = currentCanvas.getBoundingClientRect();
  const { devicePixelRatio: ratio = 1 } = window;

  if (currentCanvas.width !== width * ratio || currentCanvas.height !== height * ratio) {
    currentCanvas.width = width * ratio;
    currentCanvas.height = height * ratio;
    context.scale(ratio, ratio);
    return true;
  }

  return false;
};

const defaultPredraw = (context) => {
  context.save();
  const { width, height } = context.canvas;
  context.clearRect(0, 0, width, height);
};

const defaultPostdraw = (context) => {
  context.restore();
};

const useCanvas = (draw, predraw = defaultPredraw, postdraw = defaultPostdraw) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let requestAnimationId;
    const render = (ctx, time) => {
      resizeCanvas(context, time, canvasRef);
      predraw(ctx, time, canvasRef);
      draw(ctx, time, canvasRef);
      postdraw(ctx, time, canvasRef);
      requestAnimationId = requestAnimationFrame((t) => render(ctx, t));
    };
    render(context);

    return () => {
      cancelAnimationFrame(requestAnimationId);
    };
  });

  return canvasRef;
};

export default useCanvas;
