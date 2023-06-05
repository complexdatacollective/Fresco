import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import MarkdownLabel from '../MarkdownLabel';

class Handle extends Component {
  constructor(props) {
    super(props);

    this.state = {
      mouseOver: false,
    };
  }

  handleMouseOver = () => {
    this.setState({ mouseOver: true });
  }

  handleMouseLeave = () => {
    this.setState({ mouseOver: false });
  }

  render() {
    const {
      domain: [min, max],
      handle: { id, value, percent },
      isActive,
      isDisabled,
      showTooltips,
      getHandleProps,
      getLabelForValue,
    } = this.props;
    const { mouseOver } = this.state;

    const showTooltip = showTooltips && (mouseOver || isActive) && !isDisabled;
    const handleProps = getHandleProps(
      id,
      {
        onMouseEnter: this.handleMouseEnter,
        onMouseLeave: this.handleMouseLeave,
      },
    );

    const markerClasses = cx(
      'form-field-slider__marker',
      { 'form-field-slider__marker--is-active': isActive },
      { 'form-field-slider__marker--is-disabled': isDisabled },
    );

    const tooltipClasses = cx(
      'form-field-slider__tooltip',
      { 'form-field-slider__tooltip--is-active': showTooltip },
    );

    const label = getLabelForValue(value);

    return (
      <>
        { showTooltips
          && (
          <div
            className={tooltipClasses}
            style={{ left: `${percent}%` }}
          >
            <MarkdownLabel inline label={label} className="form-field-slider__tooltip-label" />
          </div>
          )}
        <div
          className="form-field-slider__handle"
          style={{ left: `${percent}%` }}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...handleProps}
        />
        <div
          role="slider"
          aria-label="Slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          className={markerClasses}
          style={{ left: `${percent}%` }}
        />
      </>
    );
  }
}

Handle.propTypes = {
  domain: PropTypes.array.isRequired,
  handle: PropTypes.shape({
    id: PropTypes.any.isRequired,
    value: PropTypes.number.isRequired,
    percent: PropTypes.number.isRequired,
  }).isRequired,
  isActive: PropTypes.bool,
  isDisabled: PropTypes.bool,
  showTooltips: PropTypes.bool,
  getHandleProps: PropTypes.func.isRequired,
  getLabelForValue: PropTypes.func.isRequired,
};

Handle.defaultProps = {
  isActive: false,
  isDisabled: false,
  showTooltips: false,
};

export default Handle;
