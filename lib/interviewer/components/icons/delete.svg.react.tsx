import type { SVGProps } from 'react';

export default function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" {...props}>
      <title>Delete</title>
      <path
        className="fill-platinum-dark"
        d="M.007 2.831L2.836.003l37.172 37.173-2.828 2.828z"
      />
      <path
        className="fill-platinum-dark"
        d="M2.831 39.993L.003 37.164 37.176-.008l2.828 2.828z"
      />
    </svg>
  );
}
