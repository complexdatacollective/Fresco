import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 240" {...this.props}>
        <title>Add A Person</title>
        <path className="cls-1" d="M224 128A112.08 112.08 0 0 1 83.82 236.42 112 112 0 1 1 224 128z" />
        <path className="cls-2" d="M112 72.51c-23.8 0-43.1 21.39-43.1 47.77a50.59 50.59 0 0 0 11.1 32l64-64c-7.89-9.68-19.3-15.77-32-15.77z" />
        <path className="cls-3" d="M80 152.28c7.89 9.68 19.3 15.77 32 15.77 23.81 0 43.11-21.39 43.11-47.77a50.59 50.59 0 0 0-11.1-32z" />
        <path className="cls-3" d="M136.12 175.89c-4.09 0-13.58-7.52-10.91-11.27H98.7c2.67 3.76-6.82 11.27-10.91 11.27L112 186.66z" />
        <path className="cls-4" d="M142.41 177.82l-58.6 58.6a111.56 111.56 0 0 1-41.73-20.92c9.22-20.13 27.67-35.5 50.22-41.27a36.47 36.47 0 0 0 19.7 5.86 37.11 37.11 0 0 0 19.69-5.85 78.83 78.83 0 0 1 10.72 3.58z" />
        <path className="cls-5" d="M181.92 215.5a112.2 112.2 0 0 1-98.1 20.92l58.6-58.61a75 75 0 0 1 39.5 37.69z" />
        <ellipse className="cls-6" cx="224.5" cy="56" rx="55.5" ry="56" />
        <path className="cls-1" d="M220.5 38h8v36h-8z" />
        <path className="cls-1" d="M206.5 60v-8h36v8z" />
      </svg>
    );
  }
}
