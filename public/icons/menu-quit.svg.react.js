import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 70" {...this.props}>
        <title>Menu - Quit</title>
        <path className="cls-1" d="M0 0h60v60H0z" />
        <path className="cls-2" d="M45.96 70L0 61.25V0l45.96 8.75V70z" />
        <path className="cls-3" d="M45.96 14.89V70L2.85 61.79l43.11-46.9z" />
        <circle className="cls-1" cx="37.62" cy="38.04" r="4.41" />
      </svg>
    );
  }
}
