import type { SVGProps } from 'react';

export default function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      viewBox="0 0 35.2 28.7"
      {...props}
    >
      <path
        className="fill-sea-green"
        d="M34,1.2c-1.6-1.6-4.3-1.7-5.9,0c0,0,0,0-0.1,0.1l0,0l-16,16l-4.7-4.7c-1.6-1.6-4.3-1.7-5.9,0 c-1.6,1.6-1.7,4.3,0,5.9l9.8,9.9c0.5,0.5,1.2,0.5,1.6,0l5.1-5.1l16-16l0,0c0,0,0.1,0,0.1-0.1C35.6,5.5,35.6,2.9,34,1.2z"
      />
    </svg>
  );
}
