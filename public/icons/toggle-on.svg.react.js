import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 80" {...this.props}>
        <title>Toggle - On</title>
        <path className="cls-1" d="M0 0h140v80H0z" />
        <path className="cls-2" d="M115 15H65a25.07 25.07 0 0 0-25 25 25.07 25.07 0 0 0 25 25h50a25.07 25.07 0 0 0 25-25 25.07 25.07 0 0 0-25-25z" />
        <circle className="cls-3" cx="40" cy="40" r="40" />
      </svg>
    );
  }
}
