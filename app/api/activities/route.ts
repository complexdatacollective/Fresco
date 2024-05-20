import { NextResponse, type NextRequest } from 'next/server';
import { getActivities } from '~/queries/activityFeed';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Parse the search parameters back to their original form
  const params = {
    page: Number(searchParams.get('page')),
    perPage: Number(searchParams.get('perPage')),
    sort: searchParams.get('sort'),
    sortField: searchParams.get('sortField'),
    filterParams: JSON.parse(searchParams.get('filterParams') ?? 'null'),
  };

  const activities = await getActivities(params);

  return NextResponse.json({ data: activities });
}
