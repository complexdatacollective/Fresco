import { useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import cx from 'classnames';
import icons from '@/utils/getIcon';
import './Icon.scss';

function Icon({
  color = null,
  name,
  className = null,
  ...rest
}) {
  const iconClassNames = cx({
    icon: true,
    [`icon--${color}`]: !!color,
  }, [className]);

  const IconComponent = useMemo(() => icons(name), [name]);

  if (!IconComponent) {
    console.warn('Invalid icon name:', name); // eslint-disable-line no-console
    return null;
  }

  return (
    <IconComponent
      className={iconClassNames}
      name={name}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...rest}
    />
  );
}

Icon.propTypes = {
  name: PropTypes.string.isRequired,
  className: PropTypes.string,
  color: PropTypes.string,
  // eslint-disable-next-line
  style: PropTypes.object,
};

export default memo(Icon);
