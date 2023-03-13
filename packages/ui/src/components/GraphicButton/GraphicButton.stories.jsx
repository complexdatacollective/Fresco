import React from 'react';
import { action } from '@storybook/addon-actions';
import Harness from '@/components/StorybookHelpers/Harness';
import GraphicButton from '@/components/GraphicButton';
import openIcon from '../images/open-button.svg';
import colors from '@/components/StorybookHelpers/Colors';

const requiredProps = {
  children: (
    <>
      <h2>Action</h2>
      <h3>detail text</h3>
    </>
  ),
  onClick: () => action('onClick'),
};

export default { title: 'Components/GraphicButton' };

export const normal = () => (
  <Harness requiredProps={requiredProps}>{(props) => <GraphicButton {...props} />}</Harness>
);

export const userIcon = () => (
  <Harness requiredProps={requiredProps} graphic={openIcon}>
    {(props) => <GraphicButton {...props} />}
  </Harness>
);

export const colorVariants = () => {
  return colors.map((color) => (
    <Harness requiredProps={requiredProps} color={color}>
      {(props) => <GraphicButton {...props} />}
    </Harness>
  ));
};
