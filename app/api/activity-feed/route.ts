import { NextResponse, type NextRequest } from 'next/server';
import { searchParamsCache } from '~/app/dashboard/_components/ActivityFeed/SearchParams';
import { getActivities } from '~/queries/activityFeed';
import { requireApiAuth } from '~/utils/auth';

export async function GET(request: NextRequest) {
  await requireApiAuth();

  const rawParams = request.nextUrl.searchParams.entries();
  const searchParams = searchParamsCache.parse(Object.fromEntries(rawParams));

  const result = await getActivities(searchParams);
  return NextResponse.json(result);
}
