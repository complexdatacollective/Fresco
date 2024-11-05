import cx from 'classnames';
import { useRef } from 'react';
import { v4 as uuid } from 'uuid';

const Switch = ({
  label,
  on,
  disabled,
  className,
  onChange,
}: {
  label: string;
  on: boolean;
  disabled?: boolean;
  className: string;
  onChange: () => void;
}) => {
  const id = useRef(uuid());

  const classes = cx(
    'switch',
    className,
    { 'switch--on': on },
    { 'switch--disabled': disabled },
  );

  return (
    <label className={classes} htmlFor={id.current} title={label}>
      <input
        className="switch__input"
        id={id.current}
        checked={on}
        disabled={disabled}
        type="checkbox"
        value="true"
        onChange={onChange}
      />
      <div className="switch__button" />
      <div className="switch__label">{label}</div>
    </label>
  );
};

export default Switch;
