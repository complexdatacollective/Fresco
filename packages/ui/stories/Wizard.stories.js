/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import '../src/styles/_all.scss';
import Steps from '../src/components/Wizard/Steps';
import Step from '../src/components/Wizard/Step';

export default {
  title: 'Components/Wizard',
  args: {
    index: 1,
  },
  argTypes: {
    index: {
      control: {
        type: 'range',
        min: 1,
        max: 4,
      },
    },
  },
};

const animation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const Template = ({
  index,
}) => (
  <AnimatePresence>
    <Steps index={index}>
      <Step key="1" {...animation}>
        Step 1
      </Step>
      <Step key="2" {...animation}>
        Step 2
      </Step>
      <Step key="3" {...animation}>
        Step 3
      </Step>
    </Steps>
  </AnimatePresence>
);

export const Normal = Template.bind({});
