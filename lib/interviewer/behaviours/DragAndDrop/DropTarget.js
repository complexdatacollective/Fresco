import PropTypes from 'prop-types';
import React, { Component } from 'react';
import getAbsoluteBoundingRect from '../../utils/getAbsoluteBoundingRect';
import { actionCreators as actions } from './reducer';
import store from './store';

const maxFramesPerSecond = 10;

const dropTarget = (WrappedComponent) => {
  class DropTarget extends Component {
    constructor(props) {
      super(props);
      this.nodeRef = React.createRef();
    }

    componentDidMount() {
      if (!this.nodeRef.current?.firstElementChild) {
        return;
      }
      this.update();
    }

    componentWillUnmount() {
      this.removeTarget();
      clearTimeout(this.interval);
      cancelAnimationFrame(this.animationFrame);
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
      const node = this.nodeRef.current?.firstElementChild;
      if (!node) {
        return;
      }

      const { id, onDrop, onDrag, onDragEnd, accepts, meta } = this.props;

      const boundingClientRect = getAbsoluteBoundingRect(node);

      store.dispatch(
        actions.upsertTarget({
          id,
          onDrop,
          onDrag,
          onDragEnd,
          accepts,
          meta: meta(),
          width: boundingClientRect.width,
          height: boundingClientRect.height,
          y: boundingClientRect.top,
          x: boundingClientRect.left,
        }),
      );
    };

    render() {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { accepts, meta, ...props } = this.props;

      return (
        <div ref={this.nodeRef} style={{ display: 'contents' }}>
          <WrappedComponent {...props} />
        </div>
      );
    }
  }

  DropTarget.propTypes = {
    id: PropTypes.string.isRequired,
    onDrop: PropTypes.func,
    onDrag: PropTypes.func,
    onDragEnd: PropTypes.func,
    accepts: PropTypes.func,
    meta: PropTypes.func,
  };

  DropTarget.defaultProps = {
    meta: () => ({}),
    accepts: () => false,
    onDrop: () => ({}),
    onDrag: () => ({}),
    onDragEnd: () => ({}),
  };

  return DropTarget;
};

export default dropTarget;

export { maxFramesPerSecond };
