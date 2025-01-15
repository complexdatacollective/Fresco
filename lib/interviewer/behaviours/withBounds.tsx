import { isEqual } from 'es-toolkit';
import {
  Component,
  forwardRef,
  type ComponentType,
  type RefObject,
} from 'react';
import getAbsoluteBoundingRect from '../utils/getAbsoluteBoundingRect';

const initialState = {
  width: 0,
  height: 0,
  y: 0,
  x: 0,
};

type BoundsState = typeof initialState;

export default function withBounds<T extends object>(
  WrappedComponent: ComponentType<T>,
) {
  class WithBoundsInner extends Component<
    T & { forwardedRef?: RefObject<HTMLElement> }
  > {
    private lastState: BoundsState = initialState;
    private node: HTMLElement | null = null;
    private observer: ResizeObserver;

    state = initialState;

    constructor(props: T & { forwardedRef?: RefObject<HTMLElement> }) {
      super(props);
      this.observer = new ResizeObserver(this.measure.bind(this));
    }

    measure() {
      if (!this.node) return;

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
      if (!this.node) return;
      this.measure();
      this.observer.observe(this.node);
    }

    componentWillUnmount() {
      if (!this.observer || !this.node) return;
      this.observer.unobserve(this.node);
      this.observer.disconnect();
    }

    render() {
      const { forwardedRef, ...rest } = this.props;

      return (
        <WrappedComponent
          {...(rest as T)}
          {...this.state}
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
    <WithBoundsInner {...props} forwardedRef={ref} />
  ));
}
