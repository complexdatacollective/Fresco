/* eslint-disable @typescript-eslint/consistent-type-definitions */
// react-custom-elements.d.ts

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'multi-select-input': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          required?: boolean;
          min?: number;
          max?: number;
          name?: string;
        },
        HTMLElement
      >;
    }
  }
}
