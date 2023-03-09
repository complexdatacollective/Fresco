import React from 'react';
import '../src/styles/_all.scss';
import colors from './helpers/Colors';

export default { title: 'Global/Palette' };

const swatchStyles = {
  display: 'inline-flex',
  margin: '0 1rem 1rem 0',
  borderRadius: '100%',
  width: '7rem',
  height: '7rem',
  fontSize: '10px',
  color: 'white',
  justifyContent: 'center',
  alignItems: 'center',
  webkitUserSelect: 'text',
  msUserSelect: 'text',
  userSelect: 'text',
};

const Swatch = ({ color }) => {
  const style = {
    ...swatchStyles,
    backgroundColor: `var(--color-${color})`,
  };

  return (
    <div style={style}>--color-{color}</div>
  );
};

export const all = () => {
  return colors.map(color => (
    <Swatch color={color} />
  ));
};
