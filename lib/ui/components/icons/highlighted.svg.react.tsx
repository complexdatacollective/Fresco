import type { SVGProps } from 'react';

export default function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70" {...props}>
      <title>Highlighted</title>
      <circle className="cls-7" cx="35" cy="35" r="35" />
      <circle className="cls-3" cx="35" cy="35" r="27.5" />
      <path
        className="cls-2"
        d="M35 7.5a27.5 27.5 0 0 0-19.45 46.95l38.9-38.9A27.41 27.41 0 0 0 35 7.5z"
      />
      <circle className="cls-5" cx="35" cy="35" r="20" />
      <path
        className="cls-4"
        d="M35 15a20 20 0 0 0-14.14 34.14l28.28-28.28A19.94 19.94 0 0 0 35 15z"
      />
    </svg>
  );
}
