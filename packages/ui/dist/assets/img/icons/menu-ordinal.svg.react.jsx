import React from 'react';

export default class SVG extends React.PureComponent {
  render() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 60" {...this.props}>
        <title>Menu - ORD</title>
        <path className="cls-1" d="M63.73 0l-6.27 9.38H70L63.73 0z" />
        <path className="cls-1" d="M62.23 8h3v52h-3zM19 27h12v20H19z" />
        <circle className="cls-1" cx="25" cy="27" r="6" />
        <circle className="cls-2" cx="25" cy="54" r="6" />
        <path className="cls-2" d="M19 42h12v12H19zM31 42H19l12-11.66V42z" />
        <path className="cls-1" d="M0 39h12v12H0z" />
        <circle className="cls-1" cx="6" cy="39" r="6" />
        <circle className="cls-2" cx="6" cy="54" r="6" />
        <path className="cls-2" d="M12 54H0v-3l3.09-3H12v6z" />
        <path className="cls-2" d="M12 51H0l12-11.66V51z" />
        <path className="cls-1" d="M38 16h12v31H38z" />
        <circle className="cls-1" cx="44" cy="16" r="6" />
        <circle className="cls-2" cx="44" cy="54" r="6" />
        <path className="cls-2" d="M38 34.18h12V54H38zM50 34.18H38l12-11.66v11.66z" />
      </svg>
    );
  }
}
