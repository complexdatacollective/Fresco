import { Dispatch, SetStateAction } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { IResponseData } from './ImportCSVModal';

interface AlertDialogCSVProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  responseData: IResponseData | null;
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
              <ul className="grid grid-cols-2 gap-x-3 text-sm">
                {responseData?.existingParticipants.map((p, i) => (
                  <li key={p.id}>
                    <span className="text-green-400">identifier:</span>{' '}
                    {p.identifier}
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
