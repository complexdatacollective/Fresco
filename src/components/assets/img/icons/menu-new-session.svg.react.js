import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" {...this.props}>
        <title>Menu - New Session</title>
        <path className="cls-1" d="M23.5 23.5h13v30h-13z" />
        <path className="cls-1" d="M22.5 36.5v-13h31v13z" />
        <path className="cls-2" d="M6.5 36.5v-13h30v13z" />
        <circle className="cls-2" cx="6.5" cy="30" r="6.5" />
        <circle className="cls-1" cx="53.5" cy="30" r="6.5" />
        <path className="cls-2" d="M23.5 6.5h13v30h-13z" />
        <circle className="cls-2" cx="30" cy="6.5" r="6.5" />
        <circle className="cls-1" cx="30" cy="53.5" r="6.5" />
        <path className="cls-1" d="M36.5 36.5h-13l13-13v13z" />
      </svg>
    );
  }
}
