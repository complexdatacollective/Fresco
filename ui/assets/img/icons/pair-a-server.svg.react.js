import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" {...this.props}>
        <defs>
          <linearGradient id="linear-gradient" x1="205.19" y1="67.29" x2="205.19" y2="472.95" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#f2b700" />
            <stop offset="0.24" stopColor="#ecb207" />
            <stop offset="0.59" stopColor="#dda61a" />
            <stop offset="1" stopColor="#c49138" />
          </linearGradient>
          <clipPath id="clip-path"><circle className="cls-1" cx="205.19" cy="270.91" r="202.83" /></clipPath>
        </defs>
        <title>Pair-Server</title>
        <g id="Server">
          <circle className="cls-2" cx="205.19" cy="270.12" r="202.83" />
          <g className="cls-3">
            <rect className="cls-1" x="199.07" y="260.52" width="12.25" height="5.73" />
            <rect className="cls-4" x="143.18" y="252.83" width="124.03" height="21.12" />
            <rect className="cls-1" x="193.28" y="329.6" width="14.8" height="6.92" />
            <rect className="cls-1" x="193.28" y="315.25" width="14.8" height="7.19" />
            <rect className="cls-5" x="139.78" y="123.57" width="132.73" height="246.53" />
            <rect className="cls-4" x="128.52" y="109.22" width="68.46" height="196.8" />
            <rect className="cls-4" x="130.98" y="323.5" width="149.85" height="25.53" />
            <rect className="cls-4" x="131.91" y="370.1" width="149.85" height="25.53" />
            <rect className="cls-4" x="215.28" y="108.7" width="66.59" height="197.48" />
            <rect className="cls-4" x="81.37" y="395.63" width="247.65" height="83.85" />
            <path className="cls-6" d="M237.79,172a15.27,15.27,0,1,1,21.59-21.59" />
            <path className="cls-7" d="M259.38,150.4A15.27,15.27,0,0,1,237.79,172" />
          </g>
          <ellipse className="cls-4" cx="409.32" cy="139.87" rx="100.71" ry="101.61" />
          <rect className="cls-8" x="402.06" y="107.21" width="14.52" height="65.32" />
          <rect className="cls-8" x="402.06" y="107.21" width="14.52" height="65.32" transform="translate(269.45 549.19) rotate(-90)" />
        </g>
      </svg>
    );
  }
}
