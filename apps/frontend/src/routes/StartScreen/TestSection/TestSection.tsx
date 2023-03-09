import Section from '../Section';
import Users from './Users';
import Protocols from './Protocols';
import Interviews from './Interviews';

const TestSection = () => {
  return (
    <Section className="start-screen-section">
      <Interviews />
      <Users />
      <Protocols />
    </Section>
  );
};



TestSection.propTypes = {
};

TestSection.defaultProps = {
};

export default TestSection;
