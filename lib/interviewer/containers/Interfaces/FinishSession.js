import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from '~/lib/ui/components';

const FinishSession = ({ endSession }) => {
  const dispatch = useDispatch();
  const handleFinishSession = () => {
    // eslint-disable-next-line no-console
    console.log(
      'handleFinishSession /lib/interviewer/containers/Interfaces/FinishSession.js',
    );
    // endSession(false, true);
  };

  useEffect(() => {
    dispatch({ type: 'PLAY_SOUND', sound: 'finishSession' });
  }, [dispatch]);

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
          <Button onClick={handleFinishSession}>Finish</Button>
        </div>
      </div>
    </div>
  );
};

export default FinishSession;
