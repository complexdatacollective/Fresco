import React from 'react';
import faker from 'faker';
import { action } from '@storybook/addon-actions';
import Harness from './helpers/Harness';
import ProtocolCard from '../src/components/Cards/ProtocolCard';
import '../src/styles/_all.scss';

const requiredProps = {
  name: faker.lorem.sentence(),
  schemaVersion: 5,
  lastModified: faker.date.recent().toISOString(),
  installationDate: faker.date.recent().toISOString(),
  description: faker.lorem.sentence(),
};

export default { title: 'Components/Cards/ProtocolCard' };

export const normal = () => (
  <Harness
    requiredProps={requiredProps}
  >
    {props => <ProtocolCard {...props} />}
  </Harness>
);

export const selected = () => (
  <Harness
    requiredProps={requiredProps}
    selected
  >
    {props => <ProtocolCard {...props} />}
  </Harness>
);

export const Clickable = () => (
  <Harness
    requiredProps={requiredProps}
    onClickHandler={action('onClickHandler')}
  >
    {props => <ProtocolCard {...props} />}
  </Harness>
);

export const condensed = () => (
  <Harness
    requiredProps={requiredProps}
    name={faker.lorem.sentence()}
    description={null}
    condensed
    onClickHandler={action('onClickHandler')}
    onStatusClickHandler={action('onStatusClickHandler')}
  >
    {props => <ProtocolCard {...props} />}
  </Harness>
);

export const condensedSelected = () => (
  <Harness
    requiredProps={requiredProps}
    name={faker.lorem.sentence()}
    description={null}
    condensed
    selected
    onClickHandler={action('onClickHandler')}
    onStatusClickHandler={action('onStatusClickHandler')}
  >
    {props => <ProtocolCard {...props} />}
  </Harness>
);

export const condensedWithDescription = () => (
  <Harness
    requiredProps={requiredProps}
    name={faker.lorem.sentence()}
    description="/Users/Someone/Somepath/Some Protoco.netcanvas"
    condensed
    onClickHandler={action('onClickHandler')}
    onStatusClickHandler={action('onStatusClickHandler')}
  >
    {props => <ProtocolCard {...props} />}
  </Harness>
);


export const longname = () => (
  <Harness
    requiredProps={requiredProps}
    name={faker.lorem.sentence()}
    onClickHandler={action('onClickHandler')}
  >
    {props => <ProtocolCard {...props} />}
  </Harness>
);

export const longdescription = () => (
  <Harness
    requiredProps={requiredProps}
    description={faker.lorem.paragraphs()}
    onClickHandler={action('onClickHandler')}
  >
    {props => <ProtocolCard {...props} />}
  </Harness>
);

export const nodescription = () => (
  <Harness
    requiredProps={requiredProps}
    description={null}
    onClickHandler={action('onClickHandler')}
  >
    {props => <ProtocolCard {...props} />}
  </Harness>
);

export const isOutdated = () => (
  <Harness
    requiredProps={requiredProps}
    isOutdated
    onClickHandler={action('onClickHandler')}
    onStatusClickHandler={action('onStatusClickHandler')}
  >
    {props => <ProtocolCard {...props} />}
  </Harness>
);

export const isObsolete = () => (
  <Harness
    requiredProps={requiredProps}
    isObsolete
    onClickHandler={action('onClickHandler')}
    onStatusClickHandler={action('onStatusClickHandler')}
  >
    {props => <ProtocolCard {...props} />}
  </Harness>
);
