import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" {...this.props}>
        <title>Menu - CAT</title>
        <circle className="cls-1" cx="11.14" cy="11.14" r="11.14" />
        <path className="cls-2" d="M11.14 0a11.14 11.14 0 0 0-7.88 19L19 3.26A11.11 11.11 0 0 0 11.14 0z" />
        <circle className="cls-1" cx="11.14" cy="48.86" r="11.14" />
        <path className="cls-2" d="M11.14 37.71a11.14 11.14 0 0 0-7.88 19L19 41a11.11 11.11 0 0 0-7.86-3.29z" />
        <circle className="cls-1" cx="48.86" cy="48.86" r="11.14" />
        <path className="cls-2" d="M48.86 37.71a11.14 11.14 0 0 0-7.88 19L56.74 41a11.11 11.11 0 0 0-7.88-3.29z" />
        <circle className="cls-1" cx="48.86" cy="11.14" r="11.14" />
        <path className="cls-2" d="M48.86 0A11.14 11.14 0 0 0 41 19L56.74 3.26A11.11 11.11 0 0 0 48.86 0z" />
      </svg>
    );
  }
}
