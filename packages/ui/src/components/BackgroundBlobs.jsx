import { useMemo } from 'react';
import PropTypes from 'prop-types';
import * as blobs2 from 'blobs/v2';
import { interpolatePath as interpolate } from 'd3-interpolate-path';
import { random } from '@codaco/utils';
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
  ['rgb(45, 41, 85)', 'rgb(58,58,117)'],
];

const speeds = {
  1: random(2, 4),
  2: random(0.5, 1.5),
  3: 0.5,
};

class NCBlob {
  constructor(layer) {
    this.layer = layer; // Used to determine size and speed

    this.speed = speeds[layer];
    this.angle = (random(0, 360) * Math.PI) / 180; // in radians
    this.velocityX = Math.sin(this.angle) * this.speed;
    this.velocityY = Math.cos(this.angle) * this.speed;

    this.gradient = gradients[random(0, gradients.length - 1)];

    this.firstRender = true; // Used to know if we need to initialize contextual values
    this.animateForward = true; // Toggle for shape animation direction
  }

  // Update positionX and positionY
  updatePosition(time) {
    const timeInSeconds = time / 1000;

    if (!this.lastUpdate) { this.lastUpdate = timeInSeconds; }
    const timeDelta = timeInSeconds - this.lastUpdate || 1;

    this.lastUpdate = timeInSeconds;

    // Update position relative to time
    this.positionX += this.velocityX * timeDelta;
    this.positionY += this.velocityY * timeDelta;

    if (this.positionY + this.size < 0) {
      this.gradient = gradients[random(0, gradients.length - 1)];
      this.positionY = this.canvasHeight;
    }

    if (this.positionX + this.size < 0) {
      this.gradient = gradients[random(0, gradients.length - 1)];
      this.positionX = this.canvasWidth;
    }

    if (this.positionY > this.canvasHeight) {
      this.gradient = gradients[random(0, gradients.length - 1)];
      this.positionY = -this.size;
    }

    if (this.positionX > this.canvasWidth) {
      this.gradient = gradients[random(0, gradients.length - 1)];
      this.positionX = -this.size;
    }
  }

  invert(number) {
    return this.animateForward ? number : (number * -1) + 1;
  }

  animationPosition(time) {
    const duration = 30000; // some number of ms?

    // Start
    if (!this.startFrameTime) {
      this.startFrameTime = time;
      this.endFrameTime = time + duration;
      return this.invert(0);
    }

    if (time > this.endFrameTime) {
      this.startFrameTime = time;
      this.endFrameTime = time + duration;
      this.animateForward = !this.animateForward;
    }

    return this.invert((time - this.startFrameTime)
      / (this.endFrameTime - this.startFrameTime));
  }

  // Some properties are derived from the canvas context, so we need to
  // set them only when it is available.
  initialize(ctx) {
    const { devicePixelRatio } = window;

    // Give class knowledge of canvas height and width
    this.canvasWidth = ctx.canvas.width / devicePixelRatio;
    this.canvasHeight = ctx.canvas.height / devicePixelRatio;

    // Use vmin for sizing to get better responsiveness in landscape/portrait
    const vmin = Math.min(this.canvasWidth, this.canvasHeight);

    // Create a random blob sized based on layer
    const sizes = {
      1: random(vmin * 0.1, vmin * 0.2),
      2: random(vmin * 0.4, vmin * 0.6),
      3: random(vmin * 0.8, vmin),
    };

    this.size = sizes[this.layer];

    // Set a random starting position within the screen boundaries with
    // at least half of the shape visible
    this.positionX = random(0 - (this.size / 2), this.canvasWidth - (this.size / 2));
    this.positionY = random(0 - (this.size / 2), this.canvasHeight - (this.size / 2));

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
    this.interpolator = interpolate(this.shape, this.shape2);

    this.firstRender = false;
  }

  // Main method called from draw loop.
  // Renders the blob to the context and animates properties based on time
  render(ctx, time) {
    // Initialize context specific values
    if (this.firstRender) {
      this.initialize(ctx);
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

const BackgroundBlobs = (props) => {
  const {
    large,
    medium,
    small,
  } = props;

  const blobs = useMemo(() => [
    new Array(large).fill(null).map(() => new NCBlob(3)),
    new Array(medium).fill(null).map(() => new NCBlob(2)),
    new Array(small).fill(null).map(() => new NCBlob(1)),
  ], []);

  const drawBlobs = (ctx, time) => {
    ctx.globalCompositeOperation = 'screen';
    // ctx.globalAlpha = 0.75;
    blobs.forEach((layer) => layer.forEach((blob) => blob.render(ctx, time)));
  };

  return (
    <Canvas draw={drawBlobs} />
  );
};

BackgroundBlobs.propTypes = {
  large: PropTypes.number,
  medium: PropTypes.number,
  small: PropTypes.number,
};

BackgroundBlobs.defaultProps = {
  large: 3,
  medium: 3,
  small: 4,
};

export default BackgroundBlobs;
