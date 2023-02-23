import React, { useRef, useCallback, useImperativeHandle } from 'react';
import { clamp } from 'lodash';
import cx from 'classnames';
import PropTypes from 'prop-types';

const Scroller = React.forwardRef(({
  className,
  children,
  useSmoothScrolling,
  onScroll,
}, ref) => {
  const scrollableRef = useRef();

  useImperativeHandle(ref, () => ({
    scrollTo: (...args) => scrollableRef.current.scrollTo(...args),
  }));

  const handleScroll = useCallback(() => {
    if (!scrollableRef.current) { return; }
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

Scroller.defaultProps = {
  className: '',
  onScroll: () => {},
  useSmoothScrolling: true,
};

Scroller.propTypes = {
  children: PropTypes.any.isRequired,
  className: PropTypes.string,
  onScroll: PropTypes.func,
  useSmoothScrolling: PropTypes.bool,
};

export default Scroller;
