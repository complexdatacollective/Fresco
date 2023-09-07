interface FriendLyError extends Error {
  friendlyMessage?: string;
}
const friendlyErrorMessage = (message: string) => (error: FriendLyError) => {
  if (error.friendlyMessage) {
    throw error;
  }

  // eslint-disable-next-line no-param-reassign
  error.friendlyMessage = message;
  throw error;
};

export default friendlyErrorMessage;
