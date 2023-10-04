import Papa, { type ParseResult } from 'papaparse';

export default async function parseCSV(
  csvFile: File,
): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvFile, {
      skipEmptyLines: true,
      header: true,
      error: (error) => {
        reject(error);
      },
      complete: (results: ParseResult<Record<string, string>>) => {
        resolve(results.data);
      },
    });
  });
}
