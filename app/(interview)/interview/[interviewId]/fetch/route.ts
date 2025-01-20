import { type NextRequest, NextResponse } from 'next/server';
import { getInterviewById } from '~/queries/interviews';

export async function GET(
  _request: NextRequest,
  { params }: { params: { interviewId: string } },
) {
  const interviewId = params.interviewId;

  const result = await getInterviewById(interviewId);

  if (!result) {
    return NextResponse.json({
      status: 404,
      body: { error: 'Interview not found' },
    });
  }

  return Response.json({ result });
}
