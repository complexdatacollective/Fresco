import type { SVGProps } from 'react';

export default function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" {...props}>
      <circle className="fill-platinum-dark" cx="49" cy="11" r="11" />
      <circle className="fill-platinum-dark" cx="49" cy="49" r="11" />
      <circle className="fill-platinum-dark" cx="11" cy="30" r="11" />
      <path
        className="fill-platinum-dark"
        d="M10.001 31.735l2-3.465L44.6 47.09l-2 3.465z"
      />
      <path
        className="fill-platinum-dark"
        d="M9.997 28.272l32.6-18.814 2 3.464-32.6 18.815z"
      />
      <path
        className="fill-platinum"
        d="M3.22 22.22l15.56 15.56A11 11 0 1 1 3.22 22.22zM41.22 3.22l15.56 15.56A11 11 0 1 1 41.22 3.22zM41.22 41.22l15.56 15.56a11 11 0 1 1-15.56-15.56z"
      />
    </svg>
  );
}
