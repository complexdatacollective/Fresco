import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" {...this.props}>
        <circle className="cls-1" cx="49" cy="11" r="11" />
        <circle className="cls-1" cx="49" cy="49" r="11" />
        <circle className="cls-1" cx="11" cy="30" r="11" />
        <path className="cls-1" d="M10.001 31.735l2-3.465L44.6 47.09l-2 3.465z" />
        <path className="cls-1" d="M9.997 28.272l32.6-18.814 2 3.464-32.6 18.815z" />
        <path className="cls-2" d="M3.22 22.22l15.56 15.56A11 11 0 1 1 3.22 22.22zM41.22 3.22l15.56 15.56A11 11 0 1 1 41.22 3.22zM41.22 41.22l15.56 15.56a11 11 0 1 1-15.56-15.56z" />
      </svg>
    );
  }
}
