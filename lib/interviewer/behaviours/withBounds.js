/* eslint-disable react/no-find-dom-node */

import React, { Component } from 'react';
import { isEqual } from 'lodash';
import getAbsoluteBoundingRect from '../utils/getAbsoluteBoundingRect';
import { findDOMNode } from 'react-dom';

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

      this.observer = new ResizeObserver(this.measure.bind(this));
    }

    measure() {
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

    componentDidMount() {
      if (!this.node) {
        return;
      }

      this.measure();

      this.observer.observe(this.node);
    }

    componentWillUnmount() {
      if (!this.observer || !this.node) { return; }

      this.observer.unobserve(this.node);
      this.observer.disconnect();
    }

    render() {
      return (
        <WrappedComponent
          {...this.props}
          {...this.state}
          // findDOMNode can't be removed for now, because forwardRef requires
          // refactoring all of the other handlers to pass the ref down.
          ref={() => {
            this.node = findDOMNode(this);
          }}
        />
      );
    }
  }

  return WithBoundsInner;
}
