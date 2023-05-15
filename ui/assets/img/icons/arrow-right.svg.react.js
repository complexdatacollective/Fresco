import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 70" {...this.props}>
        <title>Arrow Right</title>
        <rect x="12.9" y="33.4" width="29.7" height="7" className="cls-2" />
        <polygon className="cls-2" points="28.8,33.4 35.8,40.4 12.9,40.4 12.9,33.4" />
        <circle className="cls-2" cx="12.9" cy="36.9" r="3.5" />
        <rect className="cls-2" x="36.6" y="20" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -10.4204 37.4352)" width="6.8" height="22.6" />
        <circle className="cls-2" cx="32" cy="23.3" r="3.4" />
        <rect className="cls-2" x="29.7" y="41.4" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -20.7241 39.7065)" width="15.8" height="6.8" />
        <rect className="cls-2" x="30.5" y="43.6" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -22.8392 38.8293)" width="9.8" height="6.8" />
        <circle className="cls-2" cx="32" cy="50.5" r="3.4" />
      </svg>
    );
  }
}
