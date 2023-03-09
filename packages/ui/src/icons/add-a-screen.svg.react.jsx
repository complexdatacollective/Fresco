import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 240" {...this.props}>
        <title>Add A Screen</title>
        <circle className="cls-1" cx="112" cy="128" r="112" />
        <ellipse className="cls-2" cx="224.5" cy="56" rx="55.5" ry="56" />
        <path className="cls-1" d="M220.5 38h8v36h-8z" />
        <path className="cls-1" d="M206.5 60v-8h36v8z" />
        <path className="cls-3" d="M70.57 78h20v100h-20z" />
        <path className="cls-3" d="M62 86.57h15.71v82.86H62zM82 86.57h17.14v82.86H82z" />
        <path className="cls-4" d="M99.14 169.43H82v-45.72l17.14-17.14v62.86z" />
        <circle className="cls-3" cx="90.57" cy="86.57" r="8.57" />
        <circle className="cls-3" cx="70.57" cy="86.57" r="8.57" />
        <circle className="cls-4" cx="70.57" cy="169.43" r="8.57" />
        <circle className="cls-4" cx="90.57" cy="169.43" r="8.57" />
        <circle className="cls-5" cx="142" cy="98" r="20" />
        <path className="cls-6" d="M142 78a20 20 0 0 0-14.14 34.14l28.28-28.28A19.94 19.94 0 0 0 142 78z" />
        <circle className="cls-5" cx="142" cy="158" r="20" />
        <path className="cls-6" d="M142 138a20 20 0 0 0-14.14 34.14l28.28-28.28A19.94 19.94 0 0 0 142 138z" />
        <path className="cls-4" d="M90.57 178h-20v-42.86l20-20V178z" />
        <path className="cls-4" d="M77.71 169.43H62v-25.72L77.71 128v41.43z" />
      </svg>
    );
  }
}
