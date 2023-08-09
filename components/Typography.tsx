import React, { type ElementType } from "react";

type Variant = "h1" | "h2" | "body";

interface Props {
  variant: Variant;
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
}

const tags: Record<Variant, ElementType> = {
  h1: "h1",
  h2: "h2",
  body: "p",
};

const sizes: Record<Variant, string> = {
  h1: "text-3xl font-medium contrast-more:font-bold contrast-less:font-thin dark:text-gray-100",
  h2: "text-2xl font-medium contrast-more:font-bold contrast-less:font-thin dark:text-gray-100",
  body: "text-lg contrast-more:font-bold contrast-less:font-thin dark:text-gray-100",
};

export const Typography = ({ variant, children, as }: Props) => {
  const sizeClasses = sizes[variant];
  const Tag = as || tags[variant];

  return <Tag className={`${sizeClasses}`}>{children}</Tag>;
};
