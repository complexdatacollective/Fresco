import { NextResponse } from 'next/server';
import { createVersionedHandler } from '~/app/api/_helpers/versioning';
import { v1 } from './_handlers/v1/handler';
import { corsHeaders } from './_handlers/v1/helpers';

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

const handlers = {
  v1: { POST: v1 },
};

export const POST = createVersionedHandler(handlers, 'POST');
