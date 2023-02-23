import React from 'react';
import PropTypes from 'prop-types';

const Skeleton = ({
  count,
  width,
  wrapper: Wrapper,
  height,
  circle,
  customClassName,
}) => {
  const style = {
    ...(width && { width }),
    ...(height && { height }),
    ...(width && height && circle && { borderRadius: '50%' }),
  };

  const className = `skeleton react-loading-skeleton ${customClassName}`;

  const elements = [...Array(count)].map((_, index) => (
    <span
      key={index}
      className={className}
      style={style}
    >
      &zwnj;
    </span>
  ));

  return (
    <>
      {Wrapper
        ? elements.map((element, i) => (
          <Wrapper key={i}>
            {element}
            &zwnj;
          </Wrapper>
        ))
        : elements}
    </>
  );
};

Skeleton.defaultProps = {
  count: 1,
  width: null,
  wrapper: null,
  height: null,
  circle: false,
  customClassName: '',
};

Skeleton.propTypes = {
  count: PropTypes.number,
  width: PropTypes.string,
  height: PropTypes.string,
  wrapper: PropTypes.any,
  circle: PropTypes.bool,
  customClassName: PropTypes.string,
};

export default Skeleton;
