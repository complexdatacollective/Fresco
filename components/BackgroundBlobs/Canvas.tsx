'use client';

import useCanvas from '~/hooks/useCanvas';

type CanvasProps = {
  draw: (ctx: CanvasRenderingContext2D, time: number) => void;
  predraw?: (ctx: CanvasRenderingContext2D, time: number) => void;
  postdraw?: (ctx: CanvasRenderingContext2D, time: number) => void;
}

const Canvas = (props: CanvasProps) => {
  const { draw, predraw, postdraw } = props;
  const canvasRef = useCanvas(draw, predraw, postdraw);

  return <canvas ref={canvasRef} className="h-full w-full" data-testid="background-blobs" />;
};

export default Canvas;
