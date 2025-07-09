import PropTypes from 'prop-types';
import Slider from './Slider';

const VisualAnalogScale = (props) => <Slider {...props} />;

VisualAnalogScale.propTypes = {
  parameters: PropTypes.shape({
    minLabel: PropTypes.string.isRequired,
    maxLabel: PropTypes.string.isRequired,
  }).isRequired,
};

export default VisualAnalogScale;
