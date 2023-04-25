import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70" {...this.props}>
        <title>Menu - Sociogram</title>
        <path className="cls-1" d="M18.741 42.178l14.996-23.004 2.514 1.638-14.996 23.004z" />
        <path className="cls-1" d="M33.74 20.818l2.512-1.638 15 23-2.513 1.64z" />
        <path className="cls-1" d="M20 42h30v3H20z" />
        <path className="cls-2" d="M35 4A31 31 0 1 1 4 35 31 31 0 0 1 35 4m0-4a35 35 0 1 0 35 35A35 35 0 0 0 35 0z" />
        <circle className="cls-3" cx="35" cy="20.5" r="7.5" />
        <path className="cls-1" d="M35 13a7.5 7.5 0 0 0-5.3 12.8l10.6-10.6A7.48 7.48 0 0 0 35 13z" />
        <circle className="cls-3" cx="20.5" cy="43.5" r="7.5" />
        <path className="cls-1" d="M20.5 36a7.5 7.5 0 0 0-5.3 12.8l10.6-10.6a7.48 7.48 0 0 0-5.3-2.2z" />
        <circle className="cls-3" cx="49.5" cy="43.5" r="7.5" />
        <path className="cls-1" d="M49.5 36a7.5 7.5 0 0 0-5.3 12.8l10.6-10.6a7.48 7.48 0 0 0-5.3-2.2z" />
      </svg>
    );
  }
}
