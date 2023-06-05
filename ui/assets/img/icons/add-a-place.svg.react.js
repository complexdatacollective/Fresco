import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 240" {...this.props}>
        <title>Add A Place</title>
        <circle className="cls-1" cx="112" cy="128" r="112" />
        <circle className="cls-1" cx="112" cy="128" r="112" />
        <ellipse className="cls-2" cx="224.5" cy="56" rx="55.5" ry="56" />
        <path className="cls-1" d="M220.5 38h8v36h-8z" />
        <path className="cls-1" d="M206.5 60v-8h36v8z" />
        <path className="cls-3" d="M73.04 133l-16.63 58h26.55l58-58H73.04z" />
        <path className="cls-4" d="M150.96 133h-9.92l-58 58h84.55l-16.63-58z" />
        <path className="cls-5" d="M134.63 73.84l-13.35 13.34A14.81 14.81 0 0 0 100.45 108l-13.56 13.57c-10.53-14.62-11.48-34.16 2-47.32a33.49 33.49 0 0 1 45.74-.41z" />
        <path className="cls-6" d="M139.69 117.74c-8.79 14.08-20.21 25.48-25.23 41.79h-5c-5-15.11-13.86-25.81-22.6-38L100.45 108a14.81 14.81 0 1 0 20.83-20.83l13.34-13.34c12.27 11.42 13.78 29.94 5.07 43.91z" />
      </svg>
    );
  }
}
