import {
  Component,
  forwardRef,
  type ComponentType,
  type RefObject,
} from 'react';
import getAbsoluteBoundingRect from '../../utils/getAbsoluteBoundingRect';
import { actionCreators as actions } from './reducer';
import store from './store';

const maxFramesPerSecond = 10;

type TargetProps = {
  id: string;
  onDrop?: () => void;
  onDrag?: () => void;
  onDragEnd?: () => void;
  accepts?: () => boolean;
  meta?: () => Record<string, unknown>;
  [key: string]: any;
};

export default function dropTarget<T extends TargetProps>(
  WrappedComponent: ComponentType<T>,
) {
  class DropTarget extends Component<
    T & { forwardedRef?: RefObject<HTMLElement> }
  > {
    static defaultProps = {
      meta: () => ({}),
      accepts: () => false,
      onDrop: () => ({}),
      onDrag: () => ({}),
      onDragEnd: () => ({}),
    };

    private node: HTMLElement | null = null;
    private interval: ReturnType<typeof setTimeout> | null = null;
    private animationFrame: number | null = null;

    componentDidMount() {
      if (!this.node) return;
      this.update();
    }

    componentWillUnmount() {
      this.removeTarget();
      if (this.interval) clearTimeout(this.interval);
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    }

    removeTarget = () => {
      const { id } = this.props;
      store.dispatch(actions.removeTarget(id));
    };

    update = () => {
      this.updateTarget();

      this.interval = setTimeout(() => {
        this.animationFrame = requestAnimationFrame(this.update);
      }, 1000 / maxFramesPerSecond);
    };

    updateTarget = () => {
      console.log('updateTarget', this.node);
      if (!this.node) return;

      const { id, onDrop, onDrag, onDragEnd, accepts, meta } = this.props;
      const boundingClientRect = getAbsoluteBoundingRect(this.node);

      store.dispatch(
        actions.upsertTarget({
          id,
          onDrop,
          onDrag,
          onDragEnd,
          accepts,
          meta: meta?.(),
          width: boundingClientRect.width,
          height: boundingClientRect.height,
          y: boundingClientRect.top,
          x: boundingClientRect.left,
        }),
      );
    };

    render() {
      const { accepts, meta, forwardedRef, ...rest } = this.props;

      return (
        <WrappedComponent
          {...(rest as T)}
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
    <DropTarget {...props} forwardedRef={ref} />
  ));
}

export { maxFramesPerSecond };
