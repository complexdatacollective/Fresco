import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 70" {...this.props}>
        <title>Menu - Purge Data</title>
        <rect className="cls-1" x="32.16" y="21.58" width="8" height="8" rx="3.95" ry="3.95" />
        <rect className="cls-1" x="48.84" y="14.58" width="8" height="8" rx="3.95" ry="3.95" />
        <path className="cls-2" d="M46.81 70H13.19L5 26h50l-8.19 44z" />
        <path className="cls-1" d="M55 26l-8.19 44H13.19l-.81-4.38L52 26h3z" />
        <path className="cls-2" d="M3.661 11.995L54.502 1.513l1.85 8.97-50.84 10.483z" />
        <path className="cls-1" d="M56.34 10.49l-31.22 6.44L32.24 6.1l22.25-4.59 1.85 8.98z" />
        <circle className="cls-2" cx="4.58" cy="16.48" r="4.58" transform="rotate(-11.65 4.56 16.46)" />
        <circle className="cls-1" cx="55.42" cy="6" r="4.58" transform="rotate(-11.65 55.446 6.003)" />
        <path className="cls-2" d="M17.603 4.448L38.699.098l1.85 8.971-21.096 4.35z" />
        <path className="cls-1" d="M40.55 9.07l-11.88 2.45L35.83.69 38.7.1l1.85 8.97z" />
        <circle className="cls-2" cx="18.53" cy="8.93" r="4.58" transform="rotate(-11.65 18.551 8.925)" />
        <circle className="cls-1" cx="39.62" cy="4.58" r="4.58" transform="rotate(-11.65 39.644 4.59)" />
      </svg>
    );
  }
}
