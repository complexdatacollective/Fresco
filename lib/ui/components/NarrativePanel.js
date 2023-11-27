import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import Expandable from './Expandable';

class NarrativePanel extends Component {
  constructor() {
    super();

    this.state = {
      open: false,
    };
  }

  toggleOpen = () => {
    this.setState((prevState) => ({ open: !prevState.open }));
  }

  render() {
    const {
      props: {
        title,
        children,
      },
      state,
      toggleOpen,
    } = this;

    return (
      <div className={cx('narrative-panel', { 'narrative-panel--open': state.open })}>
        <div
          className="narrative-panel__heading"
          role="button"
          tabIndex={0}
          onClick={toggleOpen}
        >
          {title}
        </div>
        <Expandable
          className="narrative-panel__options"
          open={state.open}
        >
          <div className="narrative-panel__options-content">
            {children}
          </div>
        </Expandable>
      </div>
    );
  }
}

NarrativePanel.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.any,
};

NarrativePanel.defaultProps = {
  children: null,
};

export default NarrativePanel;
