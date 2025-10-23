import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { finishInterview } from '~/actions/interviews';
import Button from '~/components/ui/Button';
import { useDialog } from '~/lib/dialogs/DialogProvider';
import Loading from '~/lib/interviewer/components/Loading';

const FinishSession = () => {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const interviewId = pathname.split('/').pop(); // TODO: this should come from redux

  const handleConfirmFinishInterview = async () => {
    if (!interviewId) {
      setLoading(false);
      throw new Error('No interview id found');
    }
    const finished = await finishInterview(interviewId);

    if (finished && !finished.error) {
      router.push(`/interview/finished`);
    }
  };

  useEffect(() => {
    dispatch({ type: 'PLAY_SOUND', sound: 'finishSession' });
  }, [dispatch]);

  const { openDialog } = useDialog();

  const finishInterviewConfirmation = () => {
    openDialog({
      type: 'Confirm',
      title: 'Are you sure you want to finish the interview?',
      message: (
        <p>Your responses cannot be changed after you finish the interview.</p>
      ),
      confirmLabel: 'Finish Interview',
      canCancel: true,
      onConfirm: async () => {
        setLoading(true);
        await handleConfirmFinishInterview();
      },
    });
  };

  if (loading) {
    return <Loading message="Finishing interview..." />;
  }

  return (
    <div className="interface finish-session-interface">
      <div className="finish-session-interface__frame">
        <h1 className="finish-session-interface__title type--title-1">
          Finish Interview
        </h1>
        <div className="finish-session-interface__section finish-session-interface__section--instructions">
          <p>
            You have reached the end of the interview. If you are satisfied with
            the information you have entered, you may finish the interview now.
          </p>
        </div>

        <div className="finish-session-interface__section finish-session-interface__section--buttons">
          <Button color="primary" onClick={finishInterviewConfirmation}>
            Finish
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FinishSession;
