"use client";

import React from "react";
import useCanvas from "~/hooks/useCanvas";

type CanvasProps = {
  draw: (ctx: CanvasRenderingContext2D, time: number) => void;
  predraw?: (ctx: CanvasRenderingContext2D, time: number) => void;
  postdraw?: (ctx: CanvasRenderingContext2D, time: number) => void;
};

const Canvas = (props: CanvasProps) => {
  const { draw, predraw, postdraw } = props;
  const canvasRef = useCanvas(draw, predraw, postdraw);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
};

export default Canvas;
