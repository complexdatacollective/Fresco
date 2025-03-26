import { type NextRequest } from 'next/server';
import { getInterviewById } from '~/queries/interviews';

export async function GET(
  _request: NextRequest,
  { params }: { params: { interviewId: string } },
) {
  const interviewId = params.interviewId;

  const result = await getInterviewById(interviewId);

  if (!result) {
    return Response.json({
      status: 404,
      body: { error: 'Interview not found', result: null },
    });
  }

  return Response.json({ result });
}
