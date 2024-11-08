import { useDispatch } from 'react-redux';
import { actionCreators as sessionActions } from '../ducks/modules/session';

/**
 * Custom hook that wraps the addNode action dispatch, and handles encrypting
 * variables that are labelled as 'encrypted' in the codebook.
 */
export default function useSecureAddNode() {
  const dispatch = useDispatch();

  const secureAddNode = (...properties) => {
    dispatch(sessionActions.addNode(...properties));
  };

  return secureAddNode;
}
