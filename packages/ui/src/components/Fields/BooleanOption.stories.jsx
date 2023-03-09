/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable arrow-body-style */
import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import Harness from '@/components/StorybookHelpers/Harness';
import BooleanOption from '@/components/Boolean/BooleanOption';
import '@/styles/_all.scss';

import './Boolean.stories.scss';
import Icon from '@/components/Icon';

export default { title: 'Fields/BooleanOption' };

const requiredProps = {
  label: 'This is the **boolean** option.',
  value: true,
};

export const renders = () => {
  return <Harness requiredProps={requiredProps}>{(props) => <BooleanOption {...props} />}</Harness>;
};

export const customClass = () => {
  return (
    <Harness requiredProps={requiredProps} classes="red" selected>
      {(props) => <BooleanOption {...props} />}
    </Harness>
  );
};

export const negative = () => {
  return (
    <Harness requiredProps={requiredProps} label="Renders negative state" selected negative>
      {(props) => <BooleanOption {...props} />}
    </Harness>
  );
};

export const customIcon = () => {
  const [selected, setSelected] = useState(false);
  return (
    <Harness
      requiredProps={requiredProps}
      label="This has a custom icon!"
      selected={selected}
      customIcon={
        <div style={{ marginRight: '1.2rem' }}>
          <Icon name="menu" color={selected ? 'primary' : ''} />
        </div>
      }
      onClick={() => setSelected(!selected)}
    >
      {(props) => <BooleanOption {...props} />}
    </Harness>
  );
};
