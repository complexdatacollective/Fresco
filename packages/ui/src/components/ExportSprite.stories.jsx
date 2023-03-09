/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import '../@/styles/_all.scss';
import ExportSprite from '../@/components/Sprites/ExportSprite';

export default {
  title: 'Components/Sprites/ExportSprite',
  args: {
    percentProgress: 33,
    statusText: 'Loading things...',
  },
  argTypes: {
    percentProgress: {
      control: {
        type: 'range',
        min: 0,
        max: 100,
      },
    },
  },
};

export const Normal = {
  render: ({ percentProgress, statusText }) => (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%',
      }}
    >
      <ExportSprite statusText={statusText} percentProgress={percentProgress} />
    </div>
  ),
};
