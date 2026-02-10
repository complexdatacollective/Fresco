import { last, range, zipWith } from 'es-toolkit';
import PropTypes from 'prop-types';

const equalByArea = (outerRadius, n) => {
  const rsq = outerRadius ** 2;
  const b = rsq / n;

  return range(1, n + 1)
    .reduce((memo) => {
      const previous = last(memo) || 0;
      const next = (b + previous ** 2) ** 0.5;
      return [...memo, next];
    }, [])
    .reverse();
};

const equalByIncrement = (outerRadius, n) =>
  range(1, n + 1)
    .map((v) => (v * outerRadius) / n)
    .reverse();

// Weight towards `a` by factor
const weightedAverage = (a, b, factor = 1) =>
  zipWith(a, b, (c, d) => (c * factor + d) / (1 + factor));

const Radar = ({ n = 4, skewed = true }) => {
  const num = parseInt(n, 10);
  if (Number.isNaN(num) || !num) {
    return null;
  }

  const radii = skewed
    ? weightedAverage(equalByArea(50, num), equalByIncrement(50, num), 3)
    : equalByIncrement(50, num);

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className="canvas-radar"
    >
      {radii.map((radius, index) => {
        const mixPercent = Math.round(((index + 1) / num) * 100);
        return (
          <circle
            key={index}
            cx="50"
            cy="50"
            r={radius}
            className="canvas-radar__range"
            style={{
              fill: `color-mix(in oklch, var(--color-background) ${100 - mixPercent}%, var(--color-accent) ${mixPercent}%)`,
            }}
          />
        );
      })}
    </svg>
  );
};

Radar.propTypes = {
  n: PropTypes.number,
  skewed: PropTypes.bool,
};

export default Radar;
