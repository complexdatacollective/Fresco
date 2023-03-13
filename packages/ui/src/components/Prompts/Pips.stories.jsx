/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import Pips from '@/components/Prompts/Pips';

export default {
  title: 'Components/Pips',
};

export const Primary = {
  render: ({ ...args }) => {
    const props = {
      ...args,
    };

    return (
      <>
        <Pips {...props} />
      </>
    );
  },

  args: {
    count: 3,
    currentIndex: 2,
  },
};

export const Large = {
  render: ({ ...args }) => {
    const props = {
      ...args,
    };

    return (
      <>
        <Pips {...props} />
      </>
    );
  },

  args: {
    count: 3,
    currentIndex: 2,
    large: true,
  },
};
