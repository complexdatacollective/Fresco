import 'client-only';

const API_PATH = '/api/revalidate';

export const clientRevalidateTag = (tag: string) => {
  return fetch(API_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tag,
    }),
  });
};

export const clientRevalidatePath = (path: string) => {
  return fetch(API_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path,
    }),
  });
};
