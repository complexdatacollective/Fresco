/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import '../src/styles/_all.scss';
import Pips from '../src/components/Prompts/Pips';

export default {
  title: 'Components/Pips',
};

const Template = ({ ...args }) => {
  const props = {
    ...args,
  };

  return (
    <>
      <Pips {...props} />
    </>
  );
};

export const Primary = Template.bind({});
Primary.args = {
  count: 3,
  currentIndex: 2,
};

export const Large = Template.bind({});
Large.args = {
  count: 3,
  currentIndex: 2,
  large: true,
};
