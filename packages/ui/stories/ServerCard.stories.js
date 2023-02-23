import React from 'react';
import faker from 'faker';
import { action } from '@storybook/addon-actions';
import Harness from './helpers/Harness';
import ServerCard from '../src/components/Cards/ServerCard';
import '../src/styles/_all.scss';

const requiredProps = {
  name: faker.internet.domainWord(),
  addresses: [
    faker.internet.ip(),
    faker.internet.ipv6(),
  ],
  host: faker.internet.domainName(),
};

export default { title: 'Components/Cards/ServerCard' };

export const normal = () => (
  <Harness
    requiredProps={requiredProps}
  >
    {props => <ServerCard {...props} />}
  </Harness>
);

export const clickable = () => (
  <Harness
    requiredProps={requiredProps}
    onClickHandler={action('onClickHandler')}
  >
    {props => <ServerCard {...props} />}
  </Harness>
);

export const disabled = () => (
  <Harness
    requiredProps={requiredProps}
    disabled
    onClickHandler={action('onClickHandler')}
  >
    {props => <ServerCard {...props} />}
  </Harness>
);
