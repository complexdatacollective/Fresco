declare module 'color' {
  type Color = {
    mix(color: Color, weight?: number): Color;
    desaturate(ratio: number): Color;
    darken(ratio: number): Color;
    lighten(ratio: number): Color;
    toString(): string;
    hex(): string;
    rgb(): { r: number; g: number; b: number };
    alpha(value?: number): Color | number;
  };

  type ColorConstructor = (value?: string | null) => Color;

  const color: ColorConstructor;
  export default color;
}
