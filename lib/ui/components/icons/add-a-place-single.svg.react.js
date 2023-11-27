import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 111.2 126" {...this.props}>
        <polygon className="cls-4" points="16.6,68 0,126 26.5,126 84.6,68 " />
        <polygon className="cls-5" points="94.6,68 84.6,68 26.6,126 111.2,126 " />
        <path className="cls-2" d="M78.2,8.8L64.9,22.2C58.5,17,49.2,18,44,24.4c-4.4,5.4-4.4,13.2,0,18.6L30.5,56.6C20,41.9,19,22.4,32.5,9.2C45.2-2.9,65.2-3.1,78.2,8.8z" />
        <path className="cls-1" d="M83.3,52.7c-8.8,14.1-20.2,25.5-25.2,41.8h-5c-5-15.1-13.9-25.8-22.6-38L44,43c5.1,6.4,14.5,7.3,20.8,2.2c6.4-5.1,7.3-14.5,2.2-20.8c-0.7-0.8-1.4-1.5-2.2-2.2L78.2,8.8C90.5,20.2,92,38.8,83.3,52.7z" />
      </svg>
    );
  }
}
