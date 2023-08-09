import React, { type ElementType } from "react";

type Variant = "h1" | "h2" | "h3" | "h4" | "body";

interface Props {
  variant: Variant;
  children: React.ReactNode;
  className?: string;
}

const tags: Record<Variant, ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  body: "p",
};

const sizes: Record<Variant, string> = {
  h1: "text-3xl font-medium contrast-more:font-bold contrast-less:font-thin dark:text-gray-100",
  h2: "text-2xl font-medium contrast-more:font-bold contrast-less:font-thin dark:text-gray-100",
  h3: "text-xl font-medium contrast-more:font-bold contrast-less:font-thin dark:text-gray-100",
  h4: "text-md font-medium contrast-more:font-bold contrast-less:font-thin dark:text-gray-100",
  body: "text-lg contrast-more:font-bold contrast-less:font-thin dark:text-gray-100",
};

export const Typography = ({ variant, children, className }: Props) => {
  const sizeClasses = sizes[variant];
  const Tag = tags[variant];

  if (!className) {
    return <Tag className={`${sizeClasses}`}>{children}</Tag>;
  }

  return <Tag className={`${sizeClasses} ${className}`}>{children}</Tag>;
};
