import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" {...this.props}>
        <title>Form Arrow - Right</title>
        <path className="cls-1" d="M0 0h160v160H0z" />
        <path className="cls-2" d="M80 0h80v160H80A80 80 0 0 1 0 80 80 80 0 0 1 80 0z" />
        <circle className="cls-3" cx="57.53" cy="80" r="4.53" />
        <path className="cls-3" d="M107.003 79.995l-6.258 6.258L80.04 65.549l6.258-6.258z" />
        <circle className="cls-3" cx="83.17" cy="62.42" r="4.42" transform="rotate(-45 83.166 62.422)" />
        <path className="cls-3" d="M86.29 100.707l-6.259-6.258L94.5 79.98l6.258 6.258z" />
        <circle className="cls-3" cx="83.17" cy="97.58" r="4.42" transform="rotate(-45 83.17 97.58)" />
        <path className="cls-3" d="M57.53 84.53v-9.06h41.08v9.06z" />
      </svg>
    );
  }
}
