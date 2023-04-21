/* eslint-disable no-param-reassign, no-mixed-operators */
import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import ProgressCircle from '../ProgressCircle';

const NODE_COUNT = 10;
const ROTATIONAL_SPEED = 0.015;
const GRAVITATIONAL_SPEED = 0.9834;

const px = (f) => `${Math.round(f)}px`;

const range = (min, max) => (
  Math.random() * (max - min) + min
);

const palette = [
  'rgb(226, 33, 91)',
  'rgb(242, 183, 0)',
  'rgb(0, 201, 162)',
  'rgb(15, 178, 226)',
  'rgb(211, 15, 239)',
  'rgb(255, 58, 140)',
  'rgb(15, 112, 255)',
  'rgb(112, 191, 84)',
  'rgb(247, 137, 30)',
  'rgb(237, 0, 140)',
  'rgb(232, 45, 63)',
];

const generateNode = (el, options = {}) => () => {
  const maxRange = options.size / 2;

  const node = {
    a: range(-Math.PI, Math.PI),
    h: maxRange,
    f: range(1, 3),
    d: 1,
    s: range(options.size / 12, options.size / 8),
    c: palette[Math.floor(range(0, palette.length))],
    el: document.createElement('div'),
  };

  node.el.classList.add('export-sprite__node');
  node.el.style.backgroundColor = node.c;
  node.el.style.borderRadius = px(node.s);
  node.el.style.opacity = 0;
  el.appendChild(node.el);

  return node;
};

class ExportAnimation {
  constructor(el, options = {}) {
    if (!el) { throw new Error('Element not found'); }
    this.el = el;
    this.options = options;
    this.nodes = [];
    this.start();
  }

  start() {
    this.nodes = Array(NODE_COUNT)
      .fill(undefined)
      .map(this.generateNode());

    this.loop();
  }

  generateNode() {
    return generateNode(this.el, this.options);
  }

  maxRange() {
    return this.options.size / 2;
  }

  loop() {
    // render
    this.nodes.forEach((node) => {
      const displaySize = (node.s * 0.5) + (node.s * node.h / this.maxRange());

      node.el.style.opacity = 1 - (node.h / this.maxRange());

      node.el.style.left = px(Math.sin(node.a) * node.h + this.maxRange() - displaySize * 0.5);
      node.el.style.top = px(Math.cos(node.a) * node.h + this.maxRange() - displaySize * 0.5);

      node.el.style.width = px(displaySize);
      node.el.style.height = px(displaySize);
    });

    this.nodes = this.nodes
      .reduce((nodes, node) => {
        const a = node.a - node.d * ROTATIONAL_SPEED * node.f;
        const h = node.h * (GRAVITATIONAL_SPEED ** node.f);
        const cutoff = node.s / 5;

        if (h <= cutoff) {
          this.el.removeChild(node.el);
          return nodes;
        }

        return [
          ...nodes,
          {
            ...node,
            a,
            h,
          },
        ];
      }, []);

    this.nodes = [
      ...this.nodes,
      ...Array(NODE_COUNT - this.nodes.length)
        .fill(undefined)
        .map(this.generateNode()),
    ];

    this.animation = window.requestAnimationFrame(() => this.loop());
  }

  destroy() {
    window.cancelAnimationFrame(this.animation);

    this.nodes.forEach(({ el }) => {
      this.el.removeChild(el);
    });

    this.nodes = [];
  }
}

const ExportSprite = ({
  size,
  percentProgress,
  statusText,
}) => {
  const el = useRef();
  const animation = useRef();

  useEffect(() => {
    animation.current = new ExportAnimation(el.current, {
      size,
    });

    return () => { animation.current.destroy(); };
  }, [el.current, size]);

  return (
    <div
      className="export-sprite"
      ref={el}
      style={{ width: size, height: size }}
    >
      <div
        className="export-sprite__destination"
        style={{
          left: px(size / 2),
          top: px(size / 2),
        }}
      >
        <div className="export-sprite__destination__circle">
          <ProgressCircle percentProgress={percentProgress} />
        </div>
        <div className="export-sprite__destination__text">
          <h4>{statusText}</h4>
        </div>
      </div>
    </div>
  );
};

ExportSprite.defaultProps = {
  size: 500,
  statusText: 'Exporting items...',
};

ExportSprite.propTypes = {
  size: PropTypes.number,
  percentProgress: PropTypes.number.isRequired,
  statusText: PropTypes.string,
};

export default ExportSprite;
