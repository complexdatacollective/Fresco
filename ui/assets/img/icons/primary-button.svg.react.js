import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 160" {...this.props}>
        <title>Primary Button</title>
        <circle className="cls-1" cx="80" cy="80" r="80" />
        <circle className="cls-1" cx="420" cy="80" r="80" />
        <path className="cls-1" d="M80 0h340v160H80z" />
        <circle className="cls-2" cx="417.16" cy="80" r="3.02" />
        <path className="cls-2" d="M450.147 80.005l-4.172 4.172-13.803-13.803 4.172-4.171z" />
        <circle className="cls-2" cx="434.25" cy="68.28" r="2.95" transform="rotate(-45 434.251 68.277)" />
        <path className="cls-2" d="M436.342 93.801l-4.172-4.171 9.645-9.645 4.172 4.172z" />
        <circle className="cls-2" cx="434.25" cy="91.72" r="2.95" transform="rotate(-45 434.26 91.714)" />
        <path className="cls-2" d="M417.16 83.02v-6.04h27.39v6.04z" />
      </svg>
    );
  }
}
