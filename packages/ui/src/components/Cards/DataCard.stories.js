/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { action } from '@storybook/addon-actions';
import '../src/styles/_all.scss';
import DataCard from '../src/components/Cards/DataCard';

export default {
  title: 'Components/Cards/DataCard',
  args: {
    label: 'An unstilled foxglove ',
    data: {
      foo: 'bar',
    },
    width: 470,
    height: 'auto',
    allowDrag: false,
    onClick: undefined,
  },
  argTypes: {
    onClick: {
      control: { type: 'radio' },
      options: ['None', 'Click handler'],
      mapping: {
        None: undefined,
        'Click handler': action('DataCard click'),
      },
    },
    width: {
      control: {
        type: 'range',
        min: 450,
        max: 1000,
        step: 10,
      },
    },
  },
};

const Template = ({
  label,
  data,
  width,
  height,
  allowDrag,
  onClick,
}) => (
  <div
    style={{
      width,
      height,
      display: 'flex',
    }}
  >
    <DataCard
      label={label}
      data={data}
      allowDrag={allowDrag}
      onClick={onClick}
    />
  </div>
);

export const Normal = Template.bind({});

export const LongTitle = Template.bind({});
LongTitle.args = {
  label: 'This is not to discredit the idea that the literature would have us believe that a touring cement is not but a thought',
};

export const LongData = Template.bind({});
LongData.args = {
  data: {
    description: 'A capital is the attack of a helmet. Varus trips show us how brians can be tails.',
    'this_is_an_exceptionally_long_label': 'Brians can be tails.',
    'this is an exceptionally long label with spaces': 'Brians can be tails.',
  },
};

export const Clickable = Template.bind({});
Clickable.args = {
  onClick: () => console.log('click'),
};

export const Draggable = Template.bind({});
Draggable.args = {
  allowDrag: true,
};

export const Stretch = Template.bind({});
Stretch.args = {
  height: 500,
};

export const NoData = Template.bind({});
NoData.args = {
  data: {},
};

export const NoDataStretch = Template.bind({});
NoDataStretch.args = {
  data: {},
  height: 500,
};

export const ManyRows = Template.bind({});
ManyRows.args = {
  data: {
    name: 'a truffled surfboard',
    'more detail': 'Some posit the hurtling witness',
    description: 'A capital is the attack of a helmet. Varus trips show us how brians can be tails.',
    feature: 'alarm is a bench',
    age: '42',
  },
};
