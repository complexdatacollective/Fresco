import type { SVGProps } from 'react';

export default function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 66 60" {...props}>
      <title>Contexts</title>
      <circle className="fill-platinum-dark" cx="33" cy="9.4" r="9.4" />
      <circle className="fill-platinum-dark" cx="9.4" cy="50.6" r="9.4" />
      <circle className="fill-platinum" cx="56.6" cy="50.6" r="9.4" />
      <polygon
        className="fill-platinum"
        points="47.36 15.52 4.53 58.51 0.97 46.45 24.84 4.72 41.15 4.72 47.36 15.52"
      />
      <polygon
        className="fill-platinum-dark"
        points="47.36 15.52 4.45 58.59 9.43 60 56.57 60 64.72 45.76 47.36 15.52"
      />
      <circle className="fill-cyber-grape" cx="33" cy="20.54" r="7.5" />
      <path
        className="fill-white/20"
        d="M33,13a7.5,7.5,0,0,0-5.3,12.8L38.3,15.24A7.48,7.48,0,0,0,33,13Z"
      />
      <circle className="fill-cyber-grape" cx="20.36" cy="44.98" r="7.5" />
      <path
        className="fill-white/20"
        d="M20.36,37.48a7.5,7.5,0,0,0-5.3,12.8L25.66,39.68A7.48,7.48,0,0,0,20.36,37.48Z"
      />
      <circle className="fill-cyber-grape" cx="45.64" cy="44.98" r="7.5" />
      <path
        className="fill-white/20"
        d="M45.64,37.48a7.5,7.5,0,0,0-5.3,12.8L50.94,39.68A7.48,7.48,0,0,0,45.64,37.48Z"
      />
    </svg>
  );
}
