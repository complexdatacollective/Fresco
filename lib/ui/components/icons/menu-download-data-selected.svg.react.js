import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 70" {...this.props}>
        <title>Menu - Download Data Selected</title>
        <path className="cls-1" d="M3.5 70v-7h53v7z" />
        <path className="cls-2" d="M56.5 63v7H24.32l6.99-7H56.5z" />
        <circle className="cls-1" cx="3.5" cy="66.5" r="3.5" />
        <circle className="cls-2" cx="56.5" cy="66.5" r="3.5" />
        <path className="cls-2" d="M60 30.08h-7a23 23 0 1 0-46 0H0a30 30 0 1 1 60 0z" />
        <path className="cls-1" d="M30 0A30.07 30.07 0 0 0 0 30.08h7a23 23 0 0 1 30-22l5.4-5.4A29.75 29.75 0 0 0 30 0z" />
        <circle className="cls-2" cx="56.5" cy="30.08" r="3.5" />
        <circle className="cls-1" cx="3.5" cy="30.08" r="3.5" />
        <path className="cls-2" d="M26.4 19.88h7v29.7h-7z" />
        <path className="cls-1" d="M33.4 35.81l-7 7V19.88h7v15.93z" />
        <circle className="cls-1" cx="29.9" cy="19.88" r="3.5" />
        <path className="cls-2" d="M29.899 57.382l-4.837-4.837 16.002-16.002L45.9 41.38z" />
        <circle className="cls-2" cx="43.48" cy="38.96" r="3.42" transform="rotate(-45 43.482 38.97)" />
        <path className="cls-2" d="M13.9 41.381l4.836-4.837 11.18 11.18-4.837 4.836z" />
        <path className="cls-1" d="M13.903 41.382l4.837-4.836 6.943 6.944-4.836 4.836z" />
        <circle className="cls-1" cx="16.32" cy="38.96" r="3.42" transform="rotate(-45 16.318 38.96)" />
      </svg>
    );
  }
}
