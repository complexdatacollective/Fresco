import { faker } from '@faker-js/faker';
import { action } from '@storybook/addon-actions';
import Harness from '@/components/StorybookHelpers/Harness';
import ServerCard from './ServerCard';

const requiredProps = {
  name: faker.internet.domainWord(),
  addresses: [faker.internet.ip(), faker.internet.ipv6()],
  host: faker.internet.domainName(),
};

export default { title: 'Components/Cards/ServerCard' };

export const normal = () => (
  <Harness requiredProps={requiredProps}>{(props) => <ServerCard {...props} />}</Harness>
);

export const clickable = () => (
  <Harness requiredProps={requiredProps} onClickHandler={action('onClickHandler')}>
    {(props) => <ServerCard {...props} />}
  </Harness>
);

export const disabled = () => (
  <Harness requiredProps={requiredProps} disabled onClickHandler={action('onClickHandler')}>
    {(props) => <ServerCard {...props} />}
  </Harness>
);
