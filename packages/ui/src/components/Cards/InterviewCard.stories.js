import React from 'react';
import faker from 'faker';
import { action } from '@storybook/addon-actions';
import Harness from './helpers/Harness';
import SessionCard from '../src/components/Cards/SessionCard';
import '../src/styles/_all.scss';

const requiredProps = {
  caseId: faker.lorem.sentence(),
  startedAt: faker.date.recent().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  finishedAt: faker.date.recent().toISOString(),
  lastExportedAt: faker.date.recent().toISOString(),
  protocolName: 'Mock Protocol',
  progress: 55,
};

export default { title: 'Components/Cards/SessionCard' };

export const normal = () => (
  <Harness
    requiredProps={requiredProps}
  >
    {props => <SessionCard {...props} />}
  </Harness>
);

export const clickable = () => (
  <Harness
    requiredProps={requiredProps}
    onClickHandler={action('onClickHandler')}
  >
    {props => <SessionCard {...props} />}
  </Harness>
);

export const longprotocolname = () => (
  <Harness
    requiredProps={requiredProps}
    protocolName={faker.lorem.paragraph()}
    onClickHandler={action('onClickHandler')}
  >
    {props => <SessionCard {...props} />}
  </Harness>
);

export const selected = () => (
  <Harness
    requiredProps={requiredProps}
    onClickHandler={action('onClickHandler')}
  >
    {props => <SessionCard {...props} selected />}
  </Harness>
);

export const finished = () => (
  <Harness
    requiredProps={requiredProps}
    onClickHandler={action('onClickHandler')}
  >
    {props => <SessionCard {...props} progress={100} />}
  </Harness>
);

export const loading = () => (
  <Harness
    requiredProps={requiredProps}
    loading
  >
    {props => <SessionCard {...props} />}
  </Harness>
);
