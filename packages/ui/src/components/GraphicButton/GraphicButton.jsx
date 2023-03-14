import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import cx from 'classnames';
import create from '@/images/create-button.svg';
import './GraphicButton.scss';

const GraphicButton = ({
  children,
  color,
  graphic,
  graphicPosition,
  graphicSize,
  labelPosition,
  onClick,
  disabled,
}) => {
  const styles = {
    backgroundColor: `var(--color-${color})`,
    backgroundImage: `url(${graphic})`,
    backgroundPosition: graphicPosition,
    backgroundSize: graphicSize,
  };

  const labelStyles = {
    ...labelPosition,
  };

  const className = cx(
    'graphic-button',
    {
      'graphic-button--disabled': disabled,
      'graphic-button--clickable': !disabled && !!onClick,
    }
  );

  return (
    <motion.div
      className={className}
      style={styles}
      onClick={onClick}
    >
      <div
        className="graphic-button__label"
        style={labelStyles}
      >
        {children}
      </div>
    </motion.div>
  );
};

GraphicButton.propTypes = {
  children: PropTypes.node.isRequired,
  color: PropTypes.string,
  graphic: PropTypes.string,
  graphicPosition: PropTypes.string,
  graphicSize: PropTypes.string,
  labelPosition: PropTypes.object,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
GraphicButton.defaultProps = {
  color: 'sea-green',
  graphic: create,
  graphicPosition: '50% 50%',
  graphicSize: 'contain',
  labelPosition: {},
  disabled: false,
};

export default GraphicButton;
