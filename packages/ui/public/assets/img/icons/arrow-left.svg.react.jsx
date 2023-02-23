import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 70" {...this.props}>
        <title>Arrow Left</title>
        <rect className="cls-2" x="17.2" y="33.4" width="29.7" height="7" />
        <polygon className="cls-2" points="31,40.4 24,33.4 46.9,33.4 46.9,40.4" />
        <circle className="cls-2" cx="46.9" cy="36.9" r="3.5" />
        <rect className="cls-2" x="16.4" y="31.2" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -24.2242 26.449)" width="6.8" height="22.6" />
        <circle className="cls-2" cx="27.8" cy="50.5" r="3.4" />
        <rect className="cls-2" x="14.3" y="25.5" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -13.9205 24.1777)" width="15.8" height="6.8" />
        <rect className="cls-2" x="19.4" y="23.4" transform="matrix(0.7071 -0.7071 0.7071 0.7071 -11.8053 25.0549)" width="9.8" height="6.8" />
        <circle className="cls-2" cx="27.8" cy="23.3" r="3.4" />
      </svg>
    );
  }
}
