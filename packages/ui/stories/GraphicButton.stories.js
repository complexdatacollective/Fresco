import React from 'react';
import { action } from '@storybook/addon-actions';
import Harness from './helpers/Harness';
import GraphicButton from '../src/components/GraphicButton';
import openIcon from '../src/assets/images/open-button.svg';
import colors from './helpers/Colors';

import '../src/styles/_all.scss';

const requiredProps = {
  children: <><h2>Action</h2><h3>detail text</h3></>,
  onClick: () => action('onClick')
};

export default { title: 'Components/GraphicButton' };

export const normal = () => (
  <Harness
    requiredProps={requiredProps}
  >
    {props => <GraphicButton {...props} />}
  </Harness>
);

export const userIcon = () => (
  <Harness
    requiredProps={requiredProps}
    graphic={openIcon}
  >
    {props => <GraphicButton {...props} />}
  </Harness>
);

export const colorVariants = () => {
  return colors.map(color => (
    <Harness
      requiredProps={requiredProps}
      color={color}
    >
      {props => <GraphicButton {...props} />}
    </Harness>
  ));
};



// export const userIcon = () => (
//   <Harness
//     requiredProps={requiredProps}
//     graphicPosition="-4.5rem bottom"
//     color="slate-blue--dark"
//     graphic={openIcon}
//     graphicSize="auto 105%"

//   >
//     {props => <GraphicButton {...props}><h2>Open</h2><h3>from Computer</h3></GraphicButton>}
//   </Harness>
// );
