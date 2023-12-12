import React from 'react';
import { Transition } from 'react-transition-group';
import PropTypes from 'prop-types';
import anime from 'animejs';
import { getCSSVariableAsNumber, getCSSVariableAsObject } from '../../utils/CSSVariables';


function Fade({
  children,
  customDuration,
  customEasing,
  enter = true,
  onExited = () => undefined,
  in: inProp,
}) {

  const defaultDuration = {
    enter: getCSSVariableAsNumber('--animation-duration-fast-ms'),
    exit: getCSSVariableAsNumber('--animation-duration-fast-ms'),
  };

  const defaultEasing = getCSSVariableAsObject('--animation-easing-js');

  const duration = customDuration || defaultDuration;
  const easing = customEasing || defaultEasing;

  return (
    <Transition
      timeout={duration}
      onEnter={
        (el) => {
          anime({
            targets: el,
            opacity: [0, 1],
            elasticity: 0,
            easing,
            duration: duration.enter,
          });
        }
      }
      onExit={
        (el) => {
          anime({
            targets: el,
            opacity: [1, 0],
            elasticity: 0,
            easing,
            duration: duration.exit,
          });
        }
      }
      enter={enter}
      // eslint-disable-next-line react/destructuring-assignment
      in={inProp}
      appear
      unmountOnExit
      onExited={onExited}
    >
      {children}
    </Transition>
  );
}

Fade.propTypes = {
  children: PropTypes.any,
  customDuration: PropTypes.object,
  customEasing: PropTypes.array,
  enter: PropTypes.bool,
  in: PropTypes.bool.isRequired,
  onExited: PropTypes.func,
};

export default Fade;
