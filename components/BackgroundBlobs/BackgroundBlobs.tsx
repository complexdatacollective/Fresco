'use client';

import { memo, useMemo } from 'react';
import * as blobs2 from 'blobs/v2';
import { interpolatePath as interpolate } from 'd3-interpolate-path';
import { random, randomInt } from '~/utils/lodash-replacements';
import Canvas from './Canvas';

const gradients = [
  ['rgb(237,0,140)', 'rgb(226,33,91)'],
  ['#00c9ff', '#92fe9d'],
  ['#fc466b', '#3f5efb'],
  ['#d53369', '#daae51'],
  ['#3f2b96', '#a8c0ff'],
  ['rgb(0, 201, 162)', 'rgb(0, 160, 129)'],
  ['rgb(107, 114, 236)', 'rgb(58, 58, 117)'],
  ['rgb(242, 183, 0)', 'rgb(247,137,30)'],
  ['rgb(15, 178, 226)', 'rgb(15, 112, 255)'],
  ['rgb(45, 41, 285)', 'rgb(58,58,217)'],
];

const DEFAULT_SPEED_FACTOR = 1;

class NCBlob {
  layer: 1 | 2 | 3;
  speed: number;
  angle: number;
  size: number;
  velocityX: number;
  velocityY: number;
  gradient;
  firstRender: boolean;
  animateForward: boolean;
  lastUpdate: number | null;
  positionX: number;
  positionY: number;
  canvasWidth: number;
  canvasHeight: number;
  startFrameTime: number | undefined;
  endFrameTime: number | undefined;
  shape: string | null;
  shape2: string | null;
  interpolator: ((t: number) => string) | null;

  constructor(layer: 1 | 2 | 3, speedFactor: number) {
    const speeds = {
      1: speedFactor * random(3, 6),
      2: speedFactor * random(0.5, 1.5),
      3: speedFactor * 0.5,
    };

    this.layer = layer; // Used to determine size and speed

    this.speed = speeds[layer];
    this.angle = (randomInt(0, 360) * Math.PI) / 180; // in radians
    this.velocityX = Math.sin(this.angle) * this.speed;
    this.velocityY = Math.cos(this.angle) * this.speed;

    this.gradient = gradients[randomInt(0, gradients.length - 1)];

    this.firstRender = true; // Used to know if we need to initialize contextual values
    this.animateForward = true; // Toggle for shape animation direction
    this.lastUpdate = null; // Used to calculate time delta
    this.positionX = 0; // Used to track position
    this.positionY = 0; // Used to track position
    this.size = 0; // Used to track size

    this.canvasWidth = 0; // Used to track canvas width
    this.canvasHeight = 0; // Used to track canvas height

    this.shape = null;
    this.shape2 = null;

    this.interpolator = null;
  }

  // Update positionX and positionY
  updatePosition(time: number) {
    const timeInSeconds = time / 1000;

    if (!this.lastUpdate) {
      this.lastUpdate = timeInSeconds;
    }
    const timeDelta = timeInSeconds - this.lastUpdate || 1;

    this.lastUpdate = timeInSeconds;

    // Update position relative to time
    this.positionX += this.velocityX * timeDelta;
    this.positionY += this.velocityY * timeDelta;

    if (this.positionY + this.size < 0) {
      this.gradient = gradients[randomInt(0, gradients.length - 1)];
      this.positionY = this.canvasHeight;
    }

    if (this.positionX + this.size < 0) {
      this.gradient = gradients[randomInt(0, gradients.length - 1)];
      this.positionX = this.canvasWidth;
    }

    if (this.positionY > this.canvasHeight) {
      this.gradient = gradients[randomInt(0, gradients.length - 1)];
      this.positionY = -this.size;
    }

    if (this.positionX > this.canvasWidth) {
      this.gradient = gradients[randomInt(0, gradients.length - 1)];
      this.positionX = -this.size;
    }
  }

  invert(number: number) {
    return this.animateForward ? number : number * -1 + 1;
  }

  animationPosition(time: number) {
    const duration = 30000; // some number of ms?

    // Start
    if (!this.startFrameTime) {
      this.startFrameTime = time;
      this.endFrameTime = time + duration;
      return this.invert(0);
    }

    if (!this.endFrameTime || time > this.endFrameTime) {
      this.startFrameTime = time;
      this.endFrameTime = time + duration;
      this.animateForward = !this.animateForward;
    }

    return this.invert(
      (time - this.startFrameTime) / (this.endFrameTime - this.startFrameTime),
    );
  }

  // Some properties are derived from the canvas context, so we need to
  // set them only when it is available.
  initialize(ctx: CanvasRenderingContext2D) {
    const { devicePixelRatio } = window;

    // Give class knowledge of canvas height and width
    this.canvasWidth = ctx.canvas.width / devicePixelRatio;
    this.canvasHeight = ctx.canvas.height / devicePixelRatio;

    // Use vmin for sizing to get better responsiveness in landscape/portrait
    const vmin = Math.min(this.canvasWidth, this.canvasHeight);

    // Create a random blob sized based on layer
    const sizes = {
      1: randomInt(vmin * 0.1, vmin * 0.2),
      2: randomInt(vmin * 0.3, vmin * 0.8),
      3: randomInt(vmin, vmin * 1.5),
    };

    this.size = sizes[this.layer];

    // Set a random starting position within the screen boundaries with
    // at least half of the shape visible
    this.positionX = randomInt(
      0 - this.size / 2,
      this.canvasWidth - this.size / 2,
    );
    this.positionY = randomInt(
      0 - this.size / 2,
      this.canvasHeight - this.size / 2,
    );

    // Create two random shapes to interpolate between for visual variation
    this.shape = blobs2.svgPath({
      seed: Math.random(),
      extraPoints: 6,
      randomness: 6,
      size: this.size,
    });

    this.shape2 = blobs2.svgPath({
      seed: Math.random(),
      extraPoints: 8,
      randomness: 8,
      size: this.size,
    });

    // Initialize the interpolation function
    if (typeof this.shape !== 'string' || typeof this.shape2 !== 'string') {
      throw new Error('Shape is not a string');
    }

    this.interpolator = interpolate(this.shape, this.shape2);

    this.firstRender = false;
  }

  // Main method called from draw loop.
  // Renders the blob to the context and animates properties based on time
  render(ctx: CanvasRenderingContext2D, time: number) {
    // Initialize context specific values
    if (this.firstRender) {
      this.initialize(ctx);
    }

    if (!this.interpolator) return;

    if (!this.gradient?.[0] || !this.gradient[1]) {
      return;
    }

    // Update position
    this.updatePosition(time);

    // Create gradient

    const grd = ctx.createLinearGradient(0, 0, this.size, 0);
    grd.addColorStop(0, this.gradient[0]);
    grd.addColorStop(1, this.gradient[1]);
    ctx.fillStyle = grd;

    // Render interpolated shape
    const t = this.animationPosition(time);
    const p = new Path2D(this.interpolator(t));

    // Save before translating so we can restore afterwards - important!
    ctx.save();
    ctx.translate(this.positionX, this.positionY);
    ctx.fill(p);
    ctx.restore();
  }
}

type BackgroundBlobsProps = {
  large?: number;
  medium?: number;
  small?: number;
  speedFactor?: number;
  compositeOperation?: GlobalCompositeOperation;
  filter?: CanvasFilters['filter'];
};

const BackgroundBlobs = memo(
  ({
    large = 2,
    medium = 4,
    small = 4,
    speedFactor = DEFAULT_SPEED_FACTOR,
    compositeOperation = 'screen',
    filter = '',
  }: BackgroundBlobsProps) => {
    const blobs = useMemo(
      () => [
        new Array(large).fill(null).map(() => new NCBlob(3, speedFactor)),
        new Array(medium).fill(null).map(() => new NCBlob(2, speedFactor)),
        new Array(small).fill(null).map(() => new NCBlob(1, speedFactor)),
      ],
      [large, medium, small, speedFactor],
    );

    const drawBlobs = (ctx: CanvasRenderingContext2D, time: number) => {
      ctx.globalCompositeOperation = compositeOperation;
      ctx.filter = filter;
      blobs.forEach((layer) => layer.forEach((blob) => blob.render(ctx, time)));
    };

    return <Canvas draw={drawBlobs} />;
  },
);

BackgroundBlobs.displayName = 'BackgroundBlobs';

export default memo(BackgroundBlobs);
