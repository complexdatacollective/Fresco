import type { SVGProps } from 'react';

export default function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 160" {...props}>
      <title>Warning</title>
      <circle className="fill-platinum" cx="90" cy="17.5" r="17.5" />
      <circle className="fill-platinum" cx="17.5" cy="142.5" r="17.5" />
      <circle className="fill-platinum-dark" cx="162.5" cy="142.5" r="17.5" />
      <path
        className="fill-platinum"
        d="M1.84 134.68L74.19 10h31.56l72.41 124.68H1.84z"
      />
      <path
        className="fill-platinum-dark"
        d="M78 134.68l63.36-63.36 36.8 63.36H78z"
      />
      <path className="fill-platinum" d="M17.5 126.68h145V160h-145z" />
      <circle className="fill-tomato" cx="84.29" cy="99.31" r="3" />
      <circle className="fill-tomato" cx="95.71" cy="99.31" r="3" />
      <circle className="fill-tomato-dark" cx="79.93" cy="48.69" r="3" />
      <circle className="fill-tomato-dark" cx="100.07" cy="48.69" r="3" />
      <path className="fill-tomato" d="M84.29 96.31h11.42v6H84.29z" />
      <path className="fill-tomato-dark" d="M79.93 45.69h20.15v6H79.93z" />
      <path
        className="fill-tomato-dark"
        d="M76.93 48.69l4.36 50.62h17.42l4.36-50.62H76.93z"
      />
      <path
        className="fill-tomato"
        d="M80.03 84.75l1.26 14.56h17.42l3.13-36.37-21.81 21.81z"
      />
      <path
        className="fill-platinum-dark"
        d="M162.5 126.68H86L52.64 160H162.5v-33.32z"
      />
      <circle className="fill-tomato-dark" cx="90" cy="122.68" r="12" />
      <path className="fill-tomato" d="M81.51 131.17a12 12 0 0 0 17-17z" />
    </svg>
  );
}
