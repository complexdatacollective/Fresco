import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 25" {...this.props}>
        <path className="cls-2" d="M18.6,1.8l14.4,15c1.5,1.6,1.5,4.1-0.1,5.6l0,0c-1.6,1.6-4.2,1.5-5.8-0.1l-8.5-8.9c-0.3-0.3-0.8-0.3-1.1,0l-8.6,9c-1.6,1.6-4.2,1.7-5.8,0.1l0,0c-1.6-1.5-1.6-4-0.1-5.6l14.5-15C17.8,1.4,18.3,1.4,18.6,1.8z" />
      </svg>
    );
  }
}
