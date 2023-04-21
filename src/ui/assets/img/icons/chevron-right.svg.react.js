import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg viewBox="0 0 24 36" version="1.1" xmlns="http://www.w3.org/2000/svg" {...this.props}>
        <path className="cls-2" d="M22.7,18.6L7.8,33c-1.6,1.5-4.1,1.5-5.6-0.1l0,0c-1.6-1.6-1.5-4.2,0.1-5.8l8.9-8.5c0.3-0.3,0.3-0.8,0-1.1l-9-8.6C0.6,7.3,0.6,4.7,2.2,3.1l0,0c1.5-1.6,4-1.6,5.6-0.1l15,14.5C23.1,17.8,23.1,18.3,22.7,18.6z" />
      </svg>
    );
  }
}
