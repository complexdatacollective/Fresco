import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 25" {...this.props}>
        <path className="cls-2" d="M17.4,23.2L3,8.3C1.5,6.7,1.5,4.2,3.1,2.7l0,0c1.6-1.6,4.2-1.5,5.8,0.1l8.5,8.9c0.3,0.3,0.8,0.3,1.1,0l8.6-9c1.6-1.6,4.2-1.7,5.8-0.1l0,0c1.6,1.5,1.6,4,0.1,5.6l-14.5,15C18.2,23.6,17.7,23.6,17.4,23.2z" />
      </svg>
    );
  }
}
