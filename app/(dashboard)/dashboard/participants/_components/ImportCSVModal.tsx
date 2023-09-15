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
import AlertDialogCSV from './AlertDialogCSV';
import type { Participant } from '@prisma/client';
import { env } from '~/env.mjs';

export interface ICsvParticipant {
  identifier: string;
}

export interface IResponseData {
  msg: string;
  existingParticipants: Participant[];
  createdParticipants: { count: number };
}

const ImportCSVModal = () => {
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState<IResponseData | null>(null);
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
    if (!files.length) return;

    try {
      setIsLoading(true);
      const data: any = await fetch(
        `${env.NEXT_PUBLIC_URL}/api/participants/import`,
        {
          method: 'POST',
          body: JSON.stringify(csvParticipants),
        },
      ).then(async (res) => await res.json());

      console.log(data);
      setResponseData(data);
      setOpenAlertDialog(true);
    } catch (error) {
      console.error(error);
    }
    setOpenImportDialog(false);
    clearAll();
  };

  const clearAll = () => {
    setFiles([]);
    setCsvColumns([]);
    setParsedData([]);
    setCsvParticipants([]);
    setIsLoading(false);
    setOpenImportDialog(false);
  };

  return (
    <div>
      <AlertDialogCSV
        responseData={responseData}
        open={openAlertDialog}
        setOpen={setOpenAlertDialog}
      />

      <Dialog open={openImportDialog} onOpenChange={setOpenImportDialog}>
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
            <Button disabled={isLoading} form="uploadFile" type="submit">
              {isLoading ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImportCSVModal;
