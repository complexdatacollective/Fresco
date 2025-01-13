import anime from 'animejs';
import PropTypes from 'prop-types';
import { Transition } from 'react-transition-group';
import { getCSSVariableAsNumber } from '../../utils/CSSVariables';


function Fade({
  children,
  customDuration,
  customEasing,
  enter = true,
  onExited,
  in: inProp,
}) {

  const defaultDuration = {
    enter: getCSSVariableAsNumber('--animation-duration-fast-ms'),
    exit: getCSSVariableAsNumber('--animation-duration-fast-ms'),
  };

  /*
   * animejs changed the way Cubic Bezier curves are defined in v3
   * to be a string ‘cubicBezier(x1,y1,x2,y2)’ instead of an array.
   * https://github.com/juliangarnier/anime/releases/tag/v3.0.0
   * This will need to be updated if the dependency is updated to v3.
   */
  const defaultEasing = [0.4, 0, 0.2, 1];

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
