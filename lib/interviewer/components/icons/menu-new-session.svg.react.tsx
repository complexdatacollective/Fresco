import type { SVGProps } from 'react';

export default function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" {...props}>
      <title>Menu - New Session</title>
      <path className="fill-platinum-dark" d="M23.5 23.5h13v30h-13z" />
      <path className="fill-platinum-dark" d="M22.5 36.5v-13h31v13z" />
      <path className="fill-platinum" d="M6.5 36.5v-13h30v13z" />
      <circle className="fill-platinum" cx="6.5" cy="30" r="6.5" />
      <circle className="fill-platinum-dark" cx="53.5" cy="30" r="6.5" />
      <path className="fill-platinum" d="M23.5 6.5h13v30h-13z" />
      <circle className="fill-platinum" cx="30" cy="6.5" r="6.5" />
      <circle className="fill-platinum-dark" cx="30" cy="53.5" r="6.5" />
      <path className="fill-platinum-dark" d="M36.5 36.5h-13l13-13v13z" />
    </svg>
  );
}
