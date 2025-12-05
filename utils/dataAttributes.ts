/**
 * React's types do not allow for arbitrary data attributes on HTML elements.
 * https://stackoverflow.com/questions/77701532/does-reacts-type-declarations-e-g-react-htmlattributehtmlbuttonelement-suppo
 */
export type DataAttributes = Record<`data-${string}`, string>;
