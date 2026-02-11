import { isEqual } from 'es-toolkit';
import React, { Component } from 'react';
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
      this.nodeRef = React.createRef();

      this.observer = new ResizeObserver(this.measure.bind(this));
    }

    measure() {
      const node = this.nodeRef.current?.firstElementChild;
      if (!node) {
        return;
      }

      const boundingClientRect = getAbsoluteBoundingRect(node);

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
      const node = this.nodeRef.current?.firstElementChild;
      if (!node) {
        return;
      }

      this.measure();

      this.observer.observe(node);
    }

    componentWillUnmount() {
      const node = this.nodeRef.current?.firstElementChild;
      if (!this.observer || !node) {
        return;
      }

      this.observer.unobserve(node);
      this.observer.disconnect();
    }

    render() {
      return (
        <div ref={this.nodeRef} style={{ display: 'contents' }}>
          <WrappedComponent {...this.props} {...this.state} />
        </div>
      );
    }
  }

  return WithBoundsInner;
}
