import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class Spinner extends React.PureComponent {
  render() {
    const {
      small,
      large,
      size,
    } = this.props;

    const classes = classNames(
      'spinner',
      {
        'spinner--small': small,
        'spinner--large': large,
      },
    );

    const circleSize = () => {
      if (size) {
        return { '--circle-size': size };
      }

      return {};
    };

    return (
      <div className={classes} style={circleSize()}>
        <div className="circle">
          <div className="half-circle" />
          <div className="half-circle half-circle--rotated" />
        </div>
        <div className="circle">
          <div className="half-circle" />
          <div className="half-circle half-circle--rotated" />
        </div>
        <div className="circle">
          <div className="half-circle" />
          <div className="half-circle half-circle--rotated" />
        </div>
        <div className="circle">
          <div className="half-circle" />
          <div className="half-circle half-circle--rotated" />
        </div>
      </div>
    );
  }
}

Spinner.propTypes = {
  small: PropTypes.bool,
  large: PropTypes.bool,
  size: PropTypes.string,
};

Spinner.defaultProps = {
  small: false,
  large: false,
  size: null,
};

export default Spinner;
