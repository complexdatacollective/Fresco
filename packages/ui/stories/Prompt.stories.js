/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import '../src/styles/_all.scss';
import Prompt from '../src/components/Prompts/Prompt';

const prompt = `Within the **past 6 months**, who have you felt close to, or discussed important personal matters with?`;

export default {
  title: 'Components/Prompt',
};

const Template = ({ ...args }) => {
  const props = {
    ...args,
  };

  return (
    <>
      <Prompt {...props} />
    </>
  );
};

export const Primary = Template.bind({});
Primary.args = {
  id: '123',
  text: prompt,
};

const Constrained = ({ ...args }) => {
  const props = {
    ...args,
  };

  return (
    <div style={{
      border: '1px solid red',
      width: '20%',
      height: '50%',
      '--number-of-lines': args.lines,
    }}
    >
      <Prompt {...props} />
    </div>
  );
};

export const Truncation = Constrained.bind({});
Truncation.args = {
  id: '123',
  text: 'This is a really long prompt that should be wrapped first over multiple lines but will then ultimately be truncated with ellipses because nobody should ever need to write this much for any reason at all',
  speakable: true,
  lines: 3,
};
