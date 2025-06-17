import Scroller from '~/lib/ui/components/Scroller';
import React from 'react';
import { compose } from '@reduxjs/toolkit';

const scrollable = (WrappedComponent) => {
  const Scrollable = (props) => {
    const { onScroll } = props;

    return (
      <Scroller onScroll={onScroll}>
        <WrappedComponent {...props} />
      </Scroller>
    );
  };

  return Scrollable;
};

const composedScrollable = compose(scrollable);

export default composedScrollable;
