import { unstable_cache } from 'next/cache';
import 'server-only';
import { type SearchParams } from '~/lib/data-table/types';
import { prisma } from '~/utils/db';

export const getActivities = (searchParams: unknown) =>
  unstable_cache(
    async (rawSearchParams: unknown) => {
      // Convert searchParams to the expected type
      const searchParams = rawSearchParams as SearchParams;

      // Destructure searchParams object
      const { page, perPage, sort, sortField, filterParams } = searchParams;

      // Calculate offset for pagination
      const offset = page > 0 ? (page - 1) * perPage : 0;

      // Generate filter parameters for the database query
      const queryFilterParams = filterParams
        ? {
            OR: [
              ...filterParams.map(({ id, value }) => {
                const operator = Array.isArray(value) ? 'in' : 'contains';
                return {
                  [id]: { [operator]: value },
                };
              }),
            ],
          }
        : {};

      // Execute both count and findMany queries in a single transaction
      const [count, events] = await prisma.$transaction([
        prisma.events.count({
          where: {
            ...queryFilterParams,
          },
        }),
        prisma.events.findMany({
          take: perPage,
          skip: offset,
          orderBy: { [sortField]: sort },
          where: {
            ...queryFilterParams,
          },
        }),
      ]);

      // Calculate pageCount
      const pageCount = Math.ceil(count / perPage);

      // Return events and pageCount
      return { events, pageCount };
    },
    ['getActivities'],
    {
      tags: [`getActivities`, `getActivities-${JSON.stringify(searchParams)}`],
    },
  )(searchParams);

export type ActivitiesFeed = ReturnType<typeof getActivities>;
