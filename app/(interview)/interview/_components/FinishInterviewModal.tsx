import { type Dispatch, type SetStateAction } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/AlertDialog';
import { useRouter } from 'next/navigation';
import { api } from '~/trpc/client';
import { usePathname } from 'next/navigation';
import { clientRevalidateTag } from '~/utils/clientRevalidate';

type FinishInterviewModalProps = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const FinishInterviewModal = ({ open, setOpen }: FinishInterviewModalProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const utils = api.useUtils();

  const interviewId = pathname.split('/').pop();
  const { mutateAsync: finishInterview } = api.interview.finish.useMutation({
    onError(error) {
      throw new Error(error.message);
    },
    async onSuccess() {
      await clientRevalidateTag('interview.get.byId');
      await utils.interview.get.invalidate();
      await utils.interview.get.byId.refetch();
      router.push('/interview/finished');
    },
  });
  const handleFinishInterview = async () => {
    if (!interviewId) {
      throw new Error('No interview id found');
    }
    await finishInterview({ id: interviewId });
  };
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base">
            Are you sure you want finish the interview?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            Your responses cannot be changed after you finish the interview.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              setOpen(false);
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              await handleFinishInterview();
            }}
          >
            Finish Interview
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FinishInterviewModal;
