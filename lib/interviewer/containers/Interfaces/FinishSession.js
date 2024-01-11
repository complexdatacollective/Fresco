import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Button from '~/lib/ui/components/Button';
import FinishInterviewModal from '~/app/(interview)/interview/_components/FinishInterviewModal';

const FinishSession = () => {
  const dispatch = useDispatch();
  const [openFinishInterviewModal, setOpenFinishInterviewModal] =
    useState(false);

  useEffect(() => {
    dispatch({ type: 'PLAY_SOUND', sound: 'finishSession' });
  }, [dispatch]);

  return (
    <div className="interface finish-session-interface">
      <FinishInterviewModal
        open={openFinishInterviewModal}
        setOpen={setOpenFinishInterviewModal}
      />
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
          <Button onClick={() => setOpenFinishInterviewModal(true)}>
            Finish
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FinishSession;
