import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 140" {...this.props}>
        <rect className="cls-1" x="64.33" y="43.16" width="16" height="16" rx="7.91" ry="7.91" />
        <rect className="cls-1" x="97.68" y="29.16" width="16" height="16" rx="7.91" ry="7.91" />
        <path className="cls-2" d="M93.62 140H26.38L10 52h100l-16.38 88z" />
        <path className="cls-3" d="M110 52l-16.38 88H26.38l-1.62-8.76L104 52h6z" />
        <path className="cls-2" d="M7.313 23.992L108.994 3.027l3.7 17.943L11.012 41.935z" />
        <path className="cls-3" d="M112.69 20.97L50.24 33.85l14.24-21.64 44.51-9.18 3.7 17.94z" />
        <circle className="cls-2" cx="9.16" cy="32.97" r="9.16" transform="rotate(-11.65 9.165 32.975)" />
        <circle className="cls-3" cx="110.84" cy="12" r="9.16" transform="rotate(-11.65 110.843 12.001)" />
        <path className="cls-2" d="M35.204 8.888l42.193-8.7 3.7 17.943-42.193 8.7z" />
        <path className="cls-3" d="M81.1 18.13l-23.76 4.9L71.65 1.38 77.4.19l3.7 17.94z" />
        <circle className="cls-2" cx="37.05" cy="17.86" r="9.16" transform="rotate(-11.65 37.054 17.844)" />
        <circle className="cls-3" cx="79.25" cy="9.16" r="9.16" transform="rotate(-11.65 79.24 9.173)" />
      </svg>
    );
  }
}
