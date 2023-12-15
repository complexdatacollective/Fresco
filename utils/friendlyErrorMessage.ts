type FriendLyError = {
  friendlyMessage?: string;
} & Error;
const friendlyErrorMessage = (message: string) => (error: FriendLyError) => {
  if (error.friendlyMessage) {
    throw error;
  }

  error.friendlyMessage = message;
  throw error;
};

export default friendlyErrorMessage;
