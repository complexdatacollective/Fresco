import NextLink, { type LinkProps, type LinkRestProps } from 'next/link';

export default function Link(props: LinkProps<LinkRestProps>) {
  return (
    <NextLink
      className="text-link group font-semibold transition-all duration-300 ease-in-out"
      {...props}
    >
      <span className="from-link to-link bg-gradient-to-r bg-[length:0%_2px] bg-left-bottom bg-no-repeat pb-[2px] transition-all duration-200 ease-out group-hover:bg-[length:100%_2px]">
        {props.children}
      </span>
    </NextLink>
  );
}
