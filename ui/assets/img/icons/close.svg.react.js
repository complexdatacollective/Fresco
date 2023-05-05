import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" {...this.props}>
        <title>Close</title>
        <path className="cls-1" d="M.007 2.831L2.836.003l37.172 37.173-2.828 2.828z" />
        <path className="cls-1" d="M2.831 39.993L.003 37.164 37.176-.008l2.828 2.828z" />
      </svg>
    );
  }
}
