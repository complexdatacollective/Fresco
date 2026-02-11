import React, { Component } from 'react';
import PropTypes from 'prop-types';
import getAbsoluteBoundingRect from '../../utils/getAbsoluteBoundingRect';
import { actionCreators as actions } from './reducer';
import store from './store';
import { maxFramesPerSecond } from './DropTarget';

const dropObstacle = (WrappedComponent) =>
  class DropObstacle extends Component {
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
      this.removeObstacle();
      clearTimeout(this.interval);
      cancelAnimationFrame(this.animationFrame);
    }

    removeObstacle = () => {
      const { id } = this.props;
      store.dispatch(actions.removeObstacle(id));
    };

    update = () => {
      this.updateObstacle();

      this.interval = setTimeout(() => {
        this.animationFrame = requestAnimationFrame(this.update);
      }, 1000 / maxFramesPerSecond);
    };

    updateObstacle = () => {
      const node = this.nodeRef.current?.firstElementChild;
      if (!node) {
        return;
      }

      const { id } = this.props;

      const boundingClientRect = getAbsoluteBoundingRect(node);

      store.dispatch(
        actions.upsertObstacle({
          id,
          width: boundingClientRect.width,
          height: boundingClientRect.height,
          y: boundingClientRect.top,
          x: boundingClientRect.left,
        }),
      );
    };

    render() {
      return (
        <div ref={this.nodeRef} style={{ display: 'contents' }}>
          <WrappedComponent {...this.props} />
        </div>
      );
    }
  };

dropObstacle.propTypes = {
  id: PropTypes.string.isRequired,
};

export default dropObstacle;
