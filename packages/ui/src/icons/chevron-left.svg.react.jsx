import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 35.5" {...this.props}>
        <path className="cls-2" d="M1.3,17.2l15-14.4c1.6-1.5,4.1-1.5,5.6,0.1l0,0c1.6,1.6,1.5,4.2-0.1,5.8l-8.9,8.5c-0.3,0.3-0.3,0.8,0,1.1l9,8.6 c1.6,1.6,1.7,4.2,0.1,5.8l0,0c-1.5,1.6-4,1.6-5.6,0.1l-15-14.5C0.9,18,0.9,17.5,1.3,17.2z" />
      </svg>
    );
  }
}
