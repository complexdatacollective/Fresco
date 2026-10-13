import { useTable, flexRender } from '@tanstack/react-table';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createAppIntl } from '@codaco/app-i18n/messages';
import { AppI18nProvider, useAppIntl } from '@codaco/app-i18n/react';
import { dataTableFeatures } from '@codaco/fresco-ui/DataTable/features';
import { fetchActivityFeedTableColumnDefs } from '~/app/dashboard/_components/ActivityFeed/ColumnDefinition';
import { formatActivityType } from '~/app/dashboard/_components/ActivityFeed/messages';
import {
  formatActivityDetails,
  type ActivityLocalization,
} from '~/i18n/activityDetails';
import { frescoLocales } from '~/i18n/locales';
import { frescoCatalogSource } from '~/src/locales/catalogs';

const legacy = 'User Ada changed an old setting';
const event = {
  id: 'test-activity',
  timestamp: new Date('2026-09-05T12:00:00Z'),
  type: 'Participant(s) Added',
  message: legacy,
  localization: {
    kind: 'participantsAdded',
    values: { username: '<img src=x onerror=alert(1)>', count: 2 },
  } satisfies ActivityLocalization,
};

function Details() {
  const intl = useAppIntl();
  const table = useTable({
    features: dataTableFeatures,
    data: [event],
    columns: fetchActivityFeedTableColumnDefs(intl),
  });
  const cell = table
    .getRowModel()
    .rows[0]?.getAllCells()
    .find((entry) => entry.column.id === 'message');
  return cell
    ? flexRender(cell.column.columnDef.cell, cell.getContext())
    : null;
}
// Loaded up front, so every render and formatter below has Spanish
// synchronously.
const es = await frescoCatalogSource.load('es');

function View({ locale }: { locale: string }) {
  return (
    <AppI18nProvider
      locale={locale}
      locales={frescoLocales}
      messages={frescoCatalogSource.peek(locale)}
    >
      <Details />
    </AppI18nProvider>
  );
}

describe('localized activity records', () => {
  it.each(['Historical Type', 'constructor', 'toString'])(
    'preserves an unknown type label verbatim: %s',
    (type) => {
      const intl = createAppIntl({ locale: 'es', messages: es });
      expect(formatActivityType(intl, type)).toBe(type);
    },
  );

  it('formats structured details in the active locale and escapes literal user values', () => {
    const view = render(<View locale="en" />);
    expect(
      screen.getByText(
        'User <img src=x onerror=alert(1)> added 2 participants.',
      ),
    ).toBeVisible();
    view.rerender(<View locale="es" />);
    expect(
      screen.getByText(
        '«<img src=x onerror=alert(1)>» añadió 2 participantes.',
      ),
    ).toBeVisible();
    expect(view.container.querySelector('img')).toBeNull();
    expect(event.message).toBe(legacy);
  });

  it.each([
    null,
    undefined,
    { kind: 'futureEvent', values: {} },
    { kind: 'userLogin', values: {} },
    { kind: 'userLogin', values: { username: 'Ada', extra: 'unexpected' } },
    { kind: 'participantsAdded', values: { username: 'Ada', count: 'two' } },
    {
      kind: 'apiTokenCreated',
      values: {
        username: 'Ada',
        descriptionMode: 'future',
        token: 'Named token',
      },
    },
    {
      kind: 'passkeyRemoved',
      values: { username: 'Ada', nameMode: 'future', passkey: 'Named key' },
    },
  ])(
    'preserves historical or unrecognized audit content verbatim: %j',
    (localization) => {
      const intl = createAppIntl({ locale: 'es', messages: es });
      expect(
        formatActivityDetails(intl, { message: legacy, localization }),
      ).toBe(legacy);
    },
  );

  it.each([
    [
      'researcher',
      'Interview “interview-42” was opened by user “Ada”.',
      '«Ada» abrió la entrevista «interview-42».',
    ],
    [
      'participant',
      'Interview “interview-42” was opened.',
      'Se abrió la entrevista «interview-42».',
    ],
  ])(
    'formats an interview opened by a %s without changing the original record',
    (actor, english, spanish) => {
      const activity = {
        message: 'Original interview-open audit record',
        localization: {
          kind: 'interviewOpened',
          values: { actor, username: 'Ada', interview: 'interview-42' },
        },
      };
      expect(
        formatActivityDetails(createAppIntl({ locale: 'en' }), activity),
      ).toBe(english);
      expect(
        formatActivityDetails(
          createAppIntl({ locale: 'es', messages: es }),
          activity,
        ),
      ).toBe(spanish);
      expect(activity.message).toBe('Original interview-open audit record');
      expect(
        formatActivityDetails(createAppIntl({ locale: 'es', messages: es }), {
          ...activity,
          localization: {
            ...activity.localization,
            values: { ...activity.localization.values, actor: 'future' },
          },
        }),
      ).toBe(activity.message);
    },
  );

  it('formats independent counts and user lists without translating research identifiers', () => {
    const intl = createAppIntl({ locale: 'es', messages: es });
    expect(
      formatActivityDetails(intl, {
        message: 'original audit record',
        localization: {
          kind: 'syntheticDeleted',
          values: { username: 'admin', interviews: 1, participants: 2 },
        },
      }),
    ).toBe(
      '«admin» eliminó 1 entrevista sintética y 2 participantes de prueba.',
    );
    expect(
      formatActivityDetails(intl, {
        message: 'original audit record',
        localization: {
          kind: 'usersDeleted',
          values: { username: 'admin', count: 2, users: ['Ana', 'Luis'] },
        },
      }),
    ).toBe('«admin» eliminó las cuentas: Ana y Luis.');
  });
});
