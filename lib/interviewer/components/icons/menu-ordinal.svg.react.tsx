import type { SVGProps } from 'react';

export default function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 60" {...props}>
      <title>Menu - ORD</title>
      <path
        className="fill-platinum-dark"
        d="M63.73 0l-6.27 9.38H70L63.73 0z"
      />
      <path
        className="fill-platinum-dark"
        d="M62.23 8h3v52h-3zM19 27h12v20H19z"
      />
      <circle className="fill-platinum-dark" cx="25" cy="27" r="6" />
      <circle className="fill-platinum" cx="25" cy="54" r="6" />
      <path
        className="fill-platinum"
        d="M19 42h12v12H19zM31 42H19l12-11.66V42z"
      />
      <path className="fill-platinum-dark" d="M0 39h12v12H0z" />
      <circle className="fill-platinum-dark" cx="6" cy="39" r="6" />
      <circle className="fill-platinum" cx="6" cy="54" r="6" />
      <path className="fill-platinum" d="M12 54H0v-3l3.09-3H12v6z" />
      <path className="fill-platinum" d="M12 51H0l12-11.66V51z" />
      <path className="fill-platinum-dark" d="M38 16h12v31H38z" />
      <circle className="fill-platinum-dark" cx="44" cy="16" r="6" />
      <circle className="fill-platinum" cx="44" cy="54" r="6" />
      <path
        className="fill-platinum"
        d="M38 34.18h12V54H38zM50 34.18H38l12-11.66v11.66z"
      />
    </svg>
  );
}
