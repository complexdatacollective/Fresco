import React, { Component, forwardRef, type ComponentType, type RefObject } from 'react';
import getAbsoluteBoundingRect from '../../utils/getAbsoluteBoundingRect';
import { actionCreators as actions } from './reducer';
import store from './store';
import { maxFramesPerSecond } from './DropTarget';

type ObstacleProps = {
  id: string;
  [key: string]: any;
};

export default function dropObstacle<T extends ObstacleProps>(WrappedComponent: ComponentType<T>) {
  class DropObstacle extends Component<T & { forwardedRef?: RefObject<HTMLElement> }> {
    private node: HTMLElement | null = null;
    private interval: ReturnType<typeof setTimeout> | null = null;
    private animationFrame: number | null = null;

    componentDidMount() {
      if (!this.node) return;
      this.update();
    }

    componentWillUnmount() {
      this.removeObstacle();
      if (this.interval) clearTimeout(this.interval);
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    }

    removeObstacle = () => {
      const { id } = this.props;
      store.dispatch(actions.removeObstacle(id));
    };

    update = () => {
      this.updateObstacle();

      this.interval = setTimeout(
        () => {
          this.animationFrame = requestAnimationFrame(this.update);
        },
        1000 / maxFramesPerSecond
      );
    };

    updateObstacle = () => {
      if (!this.node) return;

      const { id } = this.props;
      const boundingClientRect = getAbsoluteBoundingRect(this.node);

      store.dispatch(
        actions.upsertObstacle({
          id,
          width: boundingClientRect.width,
          height: boundingClientRect.height,
          y: boundingClientRect.top,
          x: boundingClientRect.left,
        })
      );
    };

    render() {
      const { forwardedRef, ...rest } = this.props;

      return (
        <WrappedComponent
          {...rest as T}
          ref={(node: HTMLElement | null) => {
            this.node = node;
            
            // Handle both callback refs and RefObject refs
            if (forwardedRef) {
              if (typeof forwardedRef === 'function') {
                forwardedRef(node);
              } else {
                // @ts-expect-error - TypeScript doesn't know this is mutable
                forwardedRef.current = node;
              }
            }
          }}
        />
      );
    }
  }

  // Use forwardRef to properly handle refs
  return forwardRef<HTMLElement, T>((props, ref) => (
    <DropObstacle {...props} forwardedRef={ref} />
  ));
}