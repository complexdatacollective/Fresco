'use client';
import Papa from 'papaparse';
import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import Dropzone from './Dropzone';
import SelectCSVColumn from './SelectCSVColumn';

export interface ICsvParticipant {
  identifier: string;
}

const ImportCSVModal = () => {
  const [files, setFiles] = useState<Array<File>>([]);
  const [parsedData, setParsedData] = useState<Array<any>>([]);
  const [csvColumns, setCsvColumns] = useState<Array<string>>([]);
  const [csvParticipants, setCsvParticipants] = useState<
    Array<ICsvParticipant>
  >([]);

  useEffect(() => {
    if (files.length) {
      parseCSV(files[0] as File);
    } else {
      setCsvColumns([]);
    }
  }, [files]);

  function parseCSV(csvFile: File) {
    // Parse local CSV file
    Papa.parse(csvFile, {
      skipEmptyLines: true,
      header: true,
      complete: function (results: Papa.ParseResult<any>) {
        setParsedData([...results.data]);
        const ObjKeys = Object.keys(results.data[0]);
        setCsvColumns([]);

        // check if the file contains 'identifier' column or has at least one column to use as an identifier
        if (ObjKeys.includes('identifier') || ObjKeys.length === 1) {
          const objKey =
            ObjKeys.find((item) => item === 'identifier') ?? ObjKeys[0];

          // convert the file data into the 'participant' format to save in DB
          const participants = results.data.map((item: any) => ({
            identifier: item[objKey as string],
          }));

          setCsvParticipants([...participants]);
        } else {
          setCsvColumns(ObjKeys);
        }
      },
    });
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const data = await fetch(
        `${process.env.NEXT_PUBLIC_URL}/api/participants/import`,
        {
          method: 'POST',
          body: JSON.stringify(csvParticipants),
        },
      ).then(async (res) => await res.json());

      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Import participants</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import participants</DialogTitle>
          <DialogDescription>Drag and drop CSV file below</DialogDescription>
        </DialogHeader>
        <form id="uploadFile" onSubmit={handleSubmit}>
          <Dropzone
            {...{ files, setFiles }}
            className="mx-auto mt-5 cursor-pointer border border-dashed border-neutral-300 p-8 transition-colors hover:border-red-400"
          />
          {csvColumns.length ? (
            <div>
              <p className="mb-2 text-sm">
                Please select which column to use as an identifier for each
                participant
              </p>
              <SelectCSVColumn
                csvColumns={csvColumns}
                setCsvParticipants={setCsvParticipants}
                parsedData={parsedData}
              />
            </div>
          ) : (
            ''
          )}
        </form>
        <DialogFooter>
          <Button form="uploadFile" type="submit">
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportCSVModal;
