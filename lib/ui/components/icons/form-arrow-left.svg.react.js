import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" {...this.props}>
        <title>Form Arrow - Left</title>
        <path className="cls-1" d="M0 0h160v160H0z" />
        <path className="cls-2" d="M80 160H0V0h80a80 80 0 0 1 80 80 80 80 0 0 1-80 80z" />
        <circle className="cls-3" cx="102.47" cy="80" r="4.53" />
        <path className="cls-3" d="M73.702 59.304l6.258 6.258-20.704 20.704-6.258-6.258z" />
        <circle className="cls-3" cx="76.83" cy="62.42" r="4.42" transform="rotate(-45 76.828 62.427)" />
        <path className="cls-3" d="M59.236 86.237l6.257-6.258 14.468 14.468-6.258 6.258z" />
        <circle className="cls-3" cx="76.83" cy="97.58" r="4.42" transform="rotate(-45 76.836 97.573)" />
        <path className="cls-3" d="M61.39 84.53v-9.06h41.08v9.06z" />
      </svg>
    );
  }
}
