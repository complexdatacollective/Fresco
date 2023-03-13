import React from 'react';
import PropTypes from 'prop-types';
import useCanvas from '../hooks/useCanvas';

const Canvas = (props) => {
  const { draw, predraw, postdraw } = props;
  const canvasRef = useCanvas(draw, predraw, postdraw);

  return (
    <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
  );
};

Canvas.propTypes = {
  draw: PropTypes.func.isRequired,
  predraw: PropTypes.func,
  postdraw: PropTypes.func,
};

Canvas.defaultProps = {
  predraw: undefined,
  postdraw: undefined,
};

export default Canvas;
