'use client';

import type { Prisma } from '@prisma/client';
import { useState } from 'react';
import { trpc } from '~/app/_trpc/client';
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
import AlertDialogCSV from '~/app/(dashboard)/dashboard/participants/_components/AlertDialogCSV';
import Dropzone from '~/app/(dashboard)/dashboard/participants/_components/Dropzone';
import SelectCSVColumn from '~/app/(dashboard)/dashboard/participants/_components/SelectCSVColumn';

export type IResponseData = {
  existingParticipants: {
    id: string;
    identifier: string;
  }[];
  createdParticipants: Prisma.BatchPayload;
};

type ImportCSVModalProps = {
  refetch: () => Promise<unknown>;
};

const ImportCSVModal = ({ refetch }: ImportCSVModalProps) => {
  const [openAlertDialog, setOpenAlertDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [responseData, setResponseData] = useState<IResponseData | undefined>(
    undefined,
  );

  const [files, setFiles] = useState<Array<File>>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [errMsg, setErrMsg] = useState<string>('');
  const [csvColumns, setCsvColumns] = useState<Array<string>>([]);
  const [csvParticipants, setCsvParticipants] = useState<
    Array<Record<string, string>>
  >([]);

  const { mutateAsync: importParticipants, isLoading } =
    trpc.participant.createMany.useMutation({
      async onSuccess() {
        await refetch();
      },
    });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!files.length) return setErrMsg('File is required!');
    let participants;
    const ObjKeys = Object.keys(csvParticipants[0] || {});

    // check if the file contains 'identifier' column or has at least one column to use as an identifier
    if (!(ObjKeys.includes('identifier') || ObjKeys.length === 1)) {
      setCsvColumns(ObjKeys);
      participants = csvParticipants.map((item) => ({
        identifier: item[selectedColumn] + '',
      }));
    } else {
      const objKey =
        ObjKeys.find((item) => item === 'identifier') ?? ObjKeys[0];
      participants = csvParticipants.map((item) => ({
        identifier: item[objKey as string] + '',
      }));
    }
    const result = await importParticipants(participants);
    if (result.data === null) throw new Error(result.error);
    setResponseData(result.data);
    setOpenAlertDialog(true);
    clearAll();
  };

  const clearAll = () => {
    setFiles([]);
    setCsvColumns([]);
    setCsvParticipants([]);
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
              {...{
                files,
                setFiles,
                setCsvColumns,
                setCsvParticipants,
                setErrMsg,
                errMsg,
              }}
              className="mx-auto mt-5 cursor-pointer border border-dashed border-neutral-300 p-8 transition-colors hover:border-red-400"
            />
            {csvColumns.length ? (
              <div>
                <p className="mb-2 text-sm">
                  Please select which column to use as an identifier for each
                  participant
                </p>
                <SelectCSVColumn
                  setSelectedColumn={setSelectedColumn}
                  csvColumns={csvColumns}
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
