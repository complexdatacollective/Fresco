import NextLink from 'next/link';
import { type ComponentProps } from 'react';

type Props = ComponentProps<typeof NextLink>;

export default function Link(props: Props) {
  return (
    <NextLink
      className="text-link group font-semibold transition-all duration-300 ease-in-out"
      {...props}
    >
      <span className="from-link to-link bg-linear-to-r bg-[length:0%_2px] bg-left-bottom bg-no-repeat pb-[2px] transition-all duration-200 ease-out group-hover:bg-[length:100%_2px]">
        {props.children}
      </span>
    </NextLink>
  );
}
