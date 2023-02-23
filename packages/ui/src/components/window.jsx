import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { compose } from 'recompose';
import windowRootConsumer from './windowRootConsumer';

const getDisplayName = (WrappedComponent) => WrappedComponent.displayName || WrappedComponent.name || 'Component';

/*
 * HOC which will cause a component to be rendered outside of the main ReactDOM hierarchy,
 * useful for modals and other windowed components.
 */
const window = (WrappedComponent, defaultRoot = document.body) => {
  class Window extends Component {
    render() {
      const {
        windowRoot,
      } = this.props;

      const portal = windowRoot || defaultRoot;

      return ReactDOM.createPortal(
        // eslint-disable-next-line react/jsx-props-no-spreading
        <WrappedComponent {...this.props} />,
        portal,
      );
    }
  }

  Window.displayName = () => `Window(${getDisplayName(WrappedComponent)})`;

  Window.propTypes = {
    windowRoot: PropTypes.any,
  };

  Window.defaultProps = {
    windowRoot: null,
  };

  return Window;
};

export { window };

export default compose(
  windowRootConsumer,
  window,
);
