/* eslint-disable local-rules/require-data-mapper */
'use server';

import { unstable_noStore } from 'next/cache';
import type { SearchParams } from '~/lib/data-table/types';
import { searchParamsSchema } from '~/lib/data-table/validations/params';
import { prisma } from '~/utils/db';
import type { Activity, ActivityType } from './utils';
import { Events } from '@prisma/client';

export async function getActivities(searchParams: SearchParams) {
  unstable_noStore();

  const { page, per_page, sort, operator, timestamp, type, message } =
    searchParamsSchema.parse(searchParams);

  // Fallback page for invalid page numbers
  const pageAsNumber = Number(page);
  const fallbackPage =
    isNaN(pageAsNumber) || pageAsNumber < 1 ? 1 : pageAsNumber;
  // Number of items per page
  const perPageAsNumber = Number(per_page);
  const limit = isNaN(perPageAsNumber) ? 10 : perPageAsNumber;
  // Number of items to skip
  const offset = fallbackPage > 0 ? (fallbackPage - 1) * limit : 0;
  // Column and order to sort by
  // Spliting the sort string by "." to get the column and order
  // Example: "title.desc" => ["title", "desc"]
  const [column, order] = (sort?.split('.') as [
    keyof Events | undefined,
    'asc' | 'desc' | undefined,
  ]) ?? ['timestamp', 'desc'];

  const types = (type?.split('.') as Activity['type'][]) ?? [];

  // Transaction is used to ensure both queries are executed in a single transaction
  const [count, data] = await prisma.$transaction([
    prisma.events.count({
      where: {
        timestamp: { [operator]: timestamp },
        type: { in: types },
        message: { contains: message },
      },
    }),
    prisma.events.findMany({
      where: {
        timestamp: { [operator]: timestamp },
        type: { in: types },
        message: { contains: message },
      },
      orderBy: { [column ?? 'id']: order },
      skip: offset,
      take: limit,
    }),
  ]);

  const pageCount = Math.ceil(count + 1 / limit);
  return { data, pageCount };
}
