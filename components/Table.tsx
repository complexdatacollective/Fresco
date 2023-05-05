type Row = string[];

type TableProps = {
  columns: string[];
  rows: Row[];
};

const Table = (props: TableProps) => {
  console.log("Table rendering");
  const { columns = [], rows = [] } = props;

  return (
    <div className="overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full table-auto overflow-x-auto border border-gray-200 text-left text-sm text-gray-500 shadow-md dark:text-gray-400 sm:rounded-lg">
        <thead className=" bg-gray-200 px-4 py-3 leading-tight text-gray-700">
          <tr>
            {columns.map((column, colIndex) => (
              <th scope="col" className="px-6 py-3" key={colIndex}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              className="border-b bg-white dark:border-gray-700 dark:bg-gray-800"
              key={rowIndex}
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={`${rowIndex}-${cellIndex}`}
                  scope="row"
                  className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
