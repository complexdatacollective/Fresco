import { cache } from 'react';
import { auth } from './auth';
import { cookies } from 'next/headers';

export const getPageSession = cache(() => {
  const authRequest = auth.handleRequest({
    request: null,
    cookies,
  });
  return authRequest.validate();
});
