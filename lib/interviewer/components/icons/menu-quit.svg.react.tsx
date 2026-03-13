import type { SVGProps } from 'react';

export default function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 70" {...props}>
      <title>Menu - Quit</title>
      <path className="fill-platinum-dark" d="M0 0h60v60H0z" />
      <path className="fill-platinum" d="M45.96 70L0 61.25V0l45.96 8.75V70z" />
      <path
        className="fill-platinum-dark"
        d="M45.96 14.89V70L2.85 61.79l43.11-46.9z"
      />
      <circle className="fill-platinum-dark" cx="37.62" cy="38.04" r="4.41" />
    </svg>
  );
}
