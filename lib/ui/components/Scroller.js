import cx from 'classnames';
import { clamp } from 'lodash-es';
import PropTypes from 'prop-types';
import React, { useCallback, useImperativeHandle, useRef } from 'react';

const Scroller = React.forwardRef(function Scroller(
  { className, children, useSmoothScrolling = true, onScroll },
  ref,
) {
  const scrollableRef = useRef();

  useImperativeHandle(ref, () => ({
    scrollTo: (...args) => scrollableRef.current.scrollTo(...args),
  }));

  const handleScroll = useCallback(() => {
    if (!scrollableRef.current || !onScroll) {
      return;
    }
    const element = scrollableRef.current;
    const { scrollTop } = element;
    const maxScrollPosition = element.scrollHeight - element.clientHeight;
    const scrollAmount = scrollTop / maxScrollPosition;

    // iOS inertial scrolling takes values out of range
    const clampedScrollAmount = clamp(scrollAmount, 0, 1);

    // eslint-disable-next-line react/destructuring-assignment
    onScroll(scrollTop, clampedScrollAmount, scrollAmount);
  }, [onScroll]);

  return (
    <div
      className={cx('scrollable', className)}
      onScroll={handleScroll}
      style={{ scrollBehavior: useSmoothScrolling ? 'smooth' : 'unset' }}
      ref={scrollableRef}
    >
      {children}
    </div>
  );
});

Scroller.propTypes = {
  children: PropTypes.any.isRequired,
  className: PropTypes.string,
  onScroll: PropTypes.func,
  useSmoothScrolling: PropTypes.bool,
};

export default Scroller;
