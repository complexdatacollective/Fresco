import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70" {...this.props}>
        <title>Menu - Custom Interface</title>
        <path className="cls-1" d="M19 0v5H0V0z" />
        <circle className="cls-1" cx="18.5" cy="2.5" r="2.5" />
        <path className="cls-1" d="M5 19H0V0h5z" />
        <circle className="cls-1" cx="2.5" cy="18.5" r="2.5" />
        <path className="cls-1" d="M70 19h-5V0h5z" />
        <circle className="cls-1" cx="67.5" cy="18.5" r="2.5" />
        <path className="cls-1" d="M51 5V0h19v5z" />
        <circle className="cls-1" cx="51.5" cy="2.5" r="2.5" />
        <path className="cls-1" d="M51 70v-5h19v5z" />
        <circle className="cls-1" cx="51.5" cy="67.5" r="2.5" />
        <path className="cls-1" d="M65 51h5v19h-5z" />
        <circle className="cls-1" cx="67.5" cy="51.5" r="2.5" />
        <path className="cls-1" d="M0 51h5v19H0z" />
        <circle className="cls-1" cx="2.5" cy="51.5" r="2.5" />
        <path className="cls-1" d="M19 65v5H0v-5z" />
        <circle className="cls-1" cx="18.5" cy="67.5" r="2.5" />
        <path className="cls-2" d="M35 16.91l6.47 11.1 12.55 2.72-8.56 9.58 1.3 12.78L35 47.91l-11.76 5.18 1.3-12.78-8.56-9.58 12.55-2.72L35 16.91z" />
        <path className="cls-1" d="M41.47 28.01L35 16.91l-6.47 11.1-12.55 2.72 8.56 9.58-.58 5.73L41.9 28.1l-.43-.09z" />
      </svg>
    );
  }
}
