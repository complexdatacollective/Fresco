import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70" {...this.props}>
        <title>Menu - Map</title>
        <path className="cls-1" d="M60 38H10L0 70h70L60 38z" />
        <path className="cls-2" d="M10 38L0 70h28l32-32H10zM48.56 5.44l-8 8a8.8 8.8 0 0 0-5.57-2A8.92 8.92 0 0 0 28.1 26L20 34.18l-.36-.49A22.63 22.63 0 0 1 15 20.28 20.23 20.23 0 0 1 35 0a20 20 0 0 1 13.56 5.44" />
        <path className="cls-3" d="M55 20.28a22 22 0 0 1-4.62 13.4c-1.82 2.44-3.65 4.82-5.41 7.25a55.35 55.35 0 0 0-8.3 15.49.86.86 0 0 1-.81.6h-1.73a.87.87 0 0 1-.81-.59 59.56 59.56 0 0 0-8.43-15.5c-1.59-2.24-3.26-4.46-4.9-6.76L28.1 26a8.89 8.89 0 1 0 12.47-12.52l8-8A20.26 20.26 0 0 1 55 20.28" />
      </svg>
    );
  }
}
