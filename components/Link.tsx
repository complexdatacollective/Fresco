import NextLink, { type LinkProps, type LinkRestProps } from "next/link";

export default function Link(props: LinkProps<LinkRestProps>) {
  return (
    <NextLink
      className="group text-pink-500 transition-all duration-300 ease-in-out"
      {...props}
    >
      <span className="bg-gradient-to-r from-pink-500 to-pink-500 bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-all duration-500 ease-out group-hover:bg-[length:100%_2px]">
        {props.children}
      </span>
    </NextLink>
  );
}
