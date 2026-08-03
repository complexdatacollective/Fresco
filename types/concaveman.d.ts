declare module 'concaveman' {
  function concaveman(
    points: number[][],
    concavity?: number,
    lengthThreshold?: number,
  ): number[][];
  export default concaveman;
}
