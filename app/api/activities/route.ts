import { NextResponse, type NextRequest } from 'next/server';
import { type SearchParams } from 'nuqs/server';
import { searchParamsCache } from '~/app/dashboard/_components/ActivityFeed/searchParamsCache';
import { getActivities } from '~/queries/activityFeed';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const parsedParams = searchParamsCache.parse(
    searchParams as unknown as SearchParams,
  );

  const activities = await getActivities(parsedParams);

  return NextResponse.json(activities);
}
