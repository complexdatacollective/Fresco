/* eslint-disable react/no-find-dom-node */

import React, { Component } from 'react';
import { findDOMNode } from 'react-dom';
import { isEqual } from 'lodash';
import getAbsoluteBoundingRect from '../utils/getAbsoluteBoundingRect';

const initialState = {
  width: 0,
  height: 0,
  y: 0,
  x: 0,
};

export default function withBounds(WrappedComponent) {
  class WithBoundsInner extends Component {
    constructor() {
      super();

      this.state = initialState;
      this.lastState = initialState;
      this.node = null;

      this.observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.target === this.node) {
            const boundingClientRect = getAbsoluteBoundingRect(this.node);

            const nextState = {
              width: boundingClientRect.width,
              height: boundingClientRect.height,
              y: boundingClientRect.top,
              x: boundingClientRect.left,
            };

            if (!isEqual(this.lastState, nextState)) {
              this.lastState = nextState;
              this.setState(nextState);
            }
          }
        }
      });
    }

    componentDidMount() {
      this.observer.observe(this.node);
    }

    componentWillUnmount() {
      this.observer.unobserve(this.node);
      this.observer.disconnect();
    }

    render() {
      return (
        <WrappedComponent
          {...this.props}
          {...this.state}
          ref={() => {
            this.node = findDOMNode(this);
          }}
        />
      );
    }
  }

  return WithBoundsInner;
}
