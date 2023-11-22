export const makeDefaultColumns = <TData,>(data: TData[]) => {
  const firstRow = data[0];

  if (!firstRow || typeof firstRow !== 'object') {
    throw new Error('Data must be an array of objects.');
  }

  const columnKeys = Object.keys(firstRow);

  const columns = columnKeys.map((key) => {
    return {
      accessorKey: key,
      header: key,
    };
  });

  return columns;
};
