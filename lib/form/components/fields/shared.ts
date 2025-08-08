import { cva } from '~/utils/cva';

export const containerVariants = cva({
  base: 'rounded border font-semibold',
  // **or**
  // base: ["font-semibold", "border", "rounded"],
  variants: {
    intent: {
      primary: 'border-transparent bg-blue-500 text-white hover:bg-blue-600',
      // **or**
      // primary: [
      //   "bg-blue-500",
      //   "text-white",
      //   "border-transparent",
      //   "hover:bg-blue-600",
      // ],
      secondary: 'border-gray-400 bg-white text-gray-800 hover:bg-gray-100',
    },
    size: {
      small: 'px-2 py-1 text-sm',
      medium: 'px-4 py-2 text-base',
    },
  },
  compoundVariants: [
    {
      intent: 'primary',
      size: 'medium',
      class: 'uppercase',
      // **or** if you're a React.js user, `className` may feel more consistent:
      // className: "uppercase"
    },
  ],
  defaultVariants: {
    intent: 'primary',
    size: 'medium',
  },
});
