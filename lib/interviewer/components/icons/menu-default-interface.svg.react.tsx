import type { SVGProps } from 'react';

export default function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" {...props}>
      <title>Menu - Default Interface</title>
      <path className="fill-platinum-dark" d="M5.14 0h12v60h-12z" />
      <path
        className="fill-platinum-dark"
        d="M0 5.14h9.43v49.71H0zM12 5.14h10.29v49.71H12z"
      />
      <path
        className="fill-platinum"
        d="M22.29 54.86H12V27.43l10.29-10.29v37.72z"
      />
      <circle className="fill-platinum-dark" cx="17.14" cy="5.14" r="5.14" />
      <circle className="fill-platinum-dark" cx="5.14" cy="5.14" r="5.14" />
      <circle className="fill-platinum" cx="5.14" cy="54.86" r="5.14" />
      <circle className="fill-platinum" cx="17.14" cy="54.86" r="5.14" />
      <path className="fill-platinum" d="M17.14 60h-12V34.29l12-12V60z" />
      <path className="fill-platinum" d="M9.43 54.86H0V39.43L9.43 30v24.86z" />
      <circle className="fill-platinum" cx="48.86" cy="48.86" r="11.14" />
      <path
        className="fill-platinum-dark"
        d="M48.86 37.71a11.14 11.14 0 0 0-7.88 19L56.74 41a11.11 11.11 0 0 0-7.88-3.29z"
      />
      <circle className="fill-platinum" cx="48.86" cy="11.14" r="11.14" />
      <path
        className="fill-platinum-dark"
        d="M48.86 0A11.14 11.14 0 0 0 41 19L56.74 3.26A11.11 11.11 0 0 0 48.86 0z"
      />
    </svg>
  );
}
