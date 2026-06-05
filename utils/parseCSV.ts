import Papa from 'papaparse';

export default async function parseCSV<T>(csvFile: File): Promise<T[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(csvFile, {
      skipEmptyLines: true,
      header: true,
      error: (error) => {
        reject(error);
      },
      complete: (results) => {
        resolve(results.data);
      },
    });
  });
}
