import { faker } from '@faker-js/faker';
import { action } from '@storybook/addon-actions';
import Harness from '../StorybookHelpers/Harness';
import InterviewCard from './InterviewCard';

const requiredProps = {
  caseId: faker.lorem.sentence(),
  startedAt: faker.date.recent().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  finishedAt: faker.date.recent().toISOString(),
  lastExportedAt: faker.date.recent().toISOString(),
  protocolName: 'Mock Protocol',
  progress: 55,
};

export default { title: 'Components/Cards/InterviewCard' };

export const normal = () => (
  <Harness requiredProps={requiredProps}>{(props) => <InterviewCard {...props} />}</Harness>
);

export const clickable = () => (
  <Harness requiredProps={requiredProps} onClickHandler={action('onClickHandler')}>
    {(props) => <InterviewCard {...props} />}
  </Harness>
);

export const longprotocolname = () => (
  <Harness
    requiredProps={requiredProps}
    protocolName={faker.lorem.paragraph()}
    onClickHandler={action('onClickHandler')}
  >
    {(props) => <InterviewCard {...props} />}
  </Harness>
);

export const selected = () => (
  <Harness requiredProps={requiredProps} onClickHandler={action('onClickHandler')}>
    {(props) => <InterviewCard {...props} selected />}
  </Harness>
);

export const finished = () => (
  <Harness requiredProps={requiredProps} onClickHandler={action('onClickHandler')}>
    {(props) => <InterviewCard {...props} progress={100} />}
  </Harness>
);

export const loading = () => (
  <Harness requiredProps={requiredProps} loading>
    {(props) => <InterviewCard {...props} />}
  </Harness>
);
