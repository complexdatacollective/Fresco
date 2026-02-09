declare module 'quadprog' {
  const quadprog: {
    solveQP: (
      Dmat: number[][],
      dvec: number[],
      Amat: number[][],
      bvec: number[],
    ) => {
      solution: number[];
      value: number[];
      message: string;
    };
  };
  export default quadprog;
}
