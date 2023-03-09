import React from 'react';
import { Spinner } from '../src/components';
import Harness from './helpers/Harness';
import Button from '../src/components/Button';
import colors from './helpers/Colors';
import * as icons from '../src/assets/img/icons';
import '../src/styles/_all.scss';

const requiredProps = {
  iconPosition: 'left',
  onClick: () => { },
  disabled: false,
  content: 'This is a button',
};

export default { title: 'Components/Button' };

export const basic = () => (
  <Harness
    requiredProps={requiredProps}
  >
    {props => <Button {...props} />}
  </Harness>
);

export const withIcon = () => (
  <Harness
    requiredProps={requiredProps}
    icon="arrow-left"
  >
    {props => <Button {...props} />}
  </Harness>
);

export const withIconRight = () => (
  <Harness
    requiredProps={requiredProps}
    iconPosition="right"
    icon="arrow-right"
  >
    {props => <Button {...props} />}
  </Harness>
);

export const colorVariants = () => {
  return colors.map(color => (
    <Harness
      requiredProps={requiredProps}
      color={color}
    >
      {props => <Button {...props} />}
    </Harness>
  ));
};

export const iconVariants = () => {
  return Object.keys(icons.default).map(icon => (
    <Harness
      requiredProps={requiredProps}
      icon={icon}
    >
      {props => <Button {...props}> {icon}</Button>}
    </Harness>
  ));
};

export const customIcon = () => (
  <Harness
    requiredProps={requiredProps}
    color="platinum"
    iconPosition="right"
    icon={(<div><Spinner size="0.5rem" /></div>)}
  >
    {props => <Button {...props} />}
  </Harness>
);

export const sizes = () => (
  <Harness
    requiredProps={requiredProps}
  >
    {props => (
      <p>
        <Button {...props} size="small">Smol button</Button>
        <br />
        <br />
        <Button {...props}>Standard button</Button>
      </p>
    )}
  </Harness>
);

