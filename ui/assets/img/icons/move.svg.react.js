import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 70" {...this.props}>
        <title>Move</title>
        <path className="cls-1" d="M75 0H45L35 10h40a5 5 0 0 0 0-10z" />
        <path className="cls-2" d="M5 0a5 5 0 0 0 0 10h30L45 0z" />
        <circle className="cls-1" cx="75" cy="5" r="5" />
        <circle className="cls-2" cx="5" cy="5" r="5" />
        <path className="cls-2" d="M5 0h70v10H5z" />
        <path className="cls-1" d="M45 0h30v10H35L45 0zM75 60H45L35 70h40a5 5 0 0 0 0-10z" />
        <path className="cls-2" d="M5 60a5 5 0 0 0 0 10h30l10-10z" />
        <circle className="cls-1" cx="75" cy="65" r="5" />
        <circle className="cls-2" cx="5" cy="65" r="5" />
        <path className="cls-2" d="M5 60h70v10H5z" />
        <path className="cls-1" d="M45 60h30v10H35l10-10zM75 30H45L35 40h40a5 5 0 0 0 0-10z" />
        <path className="cls-2" d="M5 30a5 5 0 0 0 0 10h30l10-10z" />
        <circle className="cls-1" cx="75" cy="35" r="5" />
        <circle className="cls-2" cx="5" cy="35" r="5" />
        <path className="cls-2" d="M5 30h70v10H5z" />
        <path className="cls-1" d="M45 30h30v10H35l10-10z" />
      </svg>
    );
  }
}
