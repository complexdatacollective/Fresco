/* eslint-disable react/no-find-dom-node */

import React, { Component } from 'react';
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
      this.node = React.createRef();

      this.observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          if (entry.target === this.node.current) {
            const boundingClientRect = getAbsoluteBoundingRect(this.node.current);

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
      if (!this.node.current) {
        return;
      }

      const boundingClientRect = getAbsoluteBoundingRect(this.node.current);

      this.setState({
        width: boundingClientRect.width,
        height: boundingClientRect.height,
        y: boundingClientRect.top,
        x: boundingClientRect.left,
      });

      this.observer.observe(this.node.current);
    }

    componentWillUnmount() {
      if (!this.observer || !this.node.current) { return; }

      this.observer.unobserve(this.node.current);
      this.observer.disconnect();
    }

    render() {
      return (
        <WrappedComponent
          {...this.props}
          {...this.state}
          ref={this.node}
        />
      );
    }
  }

  return WithBoundsInner;
}
