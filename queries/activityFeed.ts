import { cacheLife } from 'next/cache';
import 'server-only';

import { createAppIntl, type IntlShape } from '@codaco/app-i18n/messages';
import { formatActivityType } from '~/app/dashboard/_components/ActivityFeed/messages';
import { type SearchParams } from '~/app/dashboard/_components/ActivityFeed/types';
import { formatActivityDetails } from '~/i18n/activityDetails';
import { frescoTimeZone } from '~/i18n/locales';
import { safeCacheTag } from '~/lib/cache';
import { prisma } from '~/lib/db';
import type { Events, Prisma } from '~/lib/db/generated/client';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const searchBatchSize = 500;
type ActivityQueryGroup = {
  where: Prisma.EventsWhereInput;
  orderBy: Prisma.EventsOrderByWithRelationInput[];
  count?: number;
};

async function activityTypeGroups(
  where: Prisma.EventsWhereInput,
  sort: 'asc' | 'desc',
  intl: IntlShape,
): Promise<ActivityQueryGroup[]> {
  const types = await prisma.events.groupBy({
    by: ['type'],
    where,
    _count: { _all: true },
  });
  const collator = new Intl.Collator(intl.locale);
  const ordered = types
    .map((type) => ({ ...type, label: formatActivityType(intl, type.type) }))
    .sort(
      (a, b) => collator.compare(a.label, b.label) * (sort === 'asc' ? 1 : -1),
    );
  const groups: { label: string; types: string[]; count: number }[] = [];
  for (const type of ordered) {
    const previous = groups.at(-1);
    if (previous && collator.compare(previous.label, type.label) === 0) {
      // Equal visible labels share one ID-ordered query, including unknown
      // historical types whose literal name matches a current translation.
      previous.types.push(type.type);
      previous.count += type._count._all;
    } else {
      groups.push({
        label: type.label,
        types: [type.type],
        count: type._count._all,
      });
    }
  }
  return groups.map((group) => ({
    where: { ...where, type: { in: group.types } },
    orderBy: [{ id: sort }],
    count: group.count,
  }));
}

export async function fetchActivities(
  rawSearchParams: unknown,
  locale: string,
) {
  'use cache';
  cacheLife('max');
  safeCacheTag('activityFeed');

  const searchParams = rawSearchParams as SearchParams;

  const { page, perPage, sort, sortField, q, type } = searchParams;

  const offset = page > 0 ? (page - 1) * perPage : 0;

  const where: Prisma.EventsWhereInput = {};
  if (type && type.length > 0) {
    where.type = { in: type };
  }
  const orderBy: Prisma.EventsOrderByWithRelationInput[] =
    sort === 'none'
      ? [{ timestamp: 'desc' }, { id: 'desc' }]
      : [{ [sortField]: sort }, { id: sort }];

  if (q || (sortField === 'type' && sort !== 'none')) {
    // Locale is an explicit cache argument. Resolve request/account state in
    // the caller, never from headers or a session inside this shared cache.
    const intl = createAppIntl({
      locale,
      messages: await frescoCatalogSource.load(locale),
      timeZone: frescoTimeZone,
    });
    const groups: ActivityQueryGroup[] =
      sortField === 'type' && sort !== 'none'
        ? await activityTypeGroups(where, sort, intl)
        : [{ where, orderBy }];
    const events: Events[] = [];
    let count = 0;
    for (const group of groups) {
      if (!q) {
        // Type counts locate the page without scanning the rows when no
        // detail search is active. The default timestamp path stays below.
        const groupCount = group.count ?? 0;
        if (count + groupCount > offset && events.length < perPage) {
          events.push(
            ...(await prisma.events.findMany({
              where: group.where,
              orderBy: group.orderBy,
              skip: Math.max(offset - count, 0),
              take: perPage - events.length,
            })),
          );
        }
        count += groupCount;
        continue;
      }

      // Arbitrary translated substring search requires visiting each source
      // record. Keep O(N) work bounded in memory: count every match, retain
      // only the requested page, and never store translated audit prose.
      let cursor: string | undefined;
      for (;;) {
        const batch: Events[] = await prisma.events.findMany({
          where: group.where,
          orderBy: group.orderBy,
          take: searchBatchSize,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });
        for (const event of batch) {
          if (
            !event.message.includes(q) &&
            !formatActivityDetails(intl, event).includes(q)
          )
            continue;
          if (count >= offset && events.length < perPage) events.push(event);
          count += 1;
        }
        const last = batch.at(-1);
        if (!last || batch.length < searchBatchSize) break;
        cursor = last.id;
      }
    }
    return { events, pageCount: Math.ceil(count / perPage) };
  }

  const [count, events] = await Promise.all([
    prisma.events.count({ where }),
    prisma.events.findMany({
      take: perPage,
      skip: offset,
      orderBy,
      where,
    }),
  ]);

  const pageCount = Math.ceil(count / perPage);
  return { events, pageCount };
}

export type ActivitiesFeed = ReturnType<typeof fetchActivities>;
