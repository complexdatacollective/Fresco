import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from '@codaco/ui';
import { isPreview } from '../../utils/Environment';

const FinishSession = ({ endSession }) => {
  const dispatch = useDispatch();
  const handleFinishSession = () => {
    console.log('handleFinishSession /lib/interviewer/containers/Interfaces/FinishSession.js');
    // endSession(false, true);
  };

  useEffect(() => {
    dispatch({ type: 'PLAY_SOUND', sound: 'finishSession' });
  }, []);

  return (
    <div className="interface finish-session-interface">
      <div className="finish-session-interface__frame">
        <h1 className="finish-session-interface__title type--title-1">
          Finish Interview
        </h1>
        <div className="finish-session-interface__section finish-session-interface__section--instructions">
          <p>
            You have reached the end of the interview.
            If you are satisfied with the information you have entered, you may finish the
            interview now.
          </p>
        </div>
        {!isPreview()
          && (
            <div className="finish-session-interface__section finish-session-interface__section--buttons">
              <Button onClick={handleFinishSession}>
                Finish
              </Button>
            </div>
          )}
      </div>
    </div>
  );
};

export default FinishSession;
