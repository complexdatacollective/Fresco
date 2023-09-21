import { type Dispatch, type SetStateAction } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { type IResponseData } from './ImportCSVModal';

interface AlertDialogCSVProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  responseData: IResponseData | undefined;
}

const AlertDialogCSV = ({
  open,
  setOpen,
  responseData,
}: AlertDialogCSVProps) => {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Participants imported successfully!
          </AlertDialogTitle>
          <div className="text-sm">
            <span className="text-red-400">Imported participants:</span>{' '}
            <span className="font-semibold">
              {responseData?.createdParticipants.count}
            </span>
          </div>
          {responseData?.existingParticipants.length ? (
            <div>
              <p className="mb-1">
                Participants with the following identifiers already exist:
              </p>
              <ul className="grid h-[350px] grid-cols-2 gap-x-2 overflow-hidden overflow-y-auto px-1 text-sm">
                {responseData?.existingParticipants.map((p) => (
                  <li key={p.id}>
                    <span className="text-green-400">identifier:</span>{' '}
                    <span className="break-words">{p.identifier}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            ''
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Okay</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AlertDialogCSV;
