'use client';

import { BadgeCheck } from 'lucide-react';

import { defineMessages } from '@codaco/app-i18n/messages';
import { resolveAppLocale } from '@codaco/app-i18n/negotiate';
import {
  AppI18nProvider,
  AppMessage,
  useLocaleCatalog,
} from '@codaco/app-i18n/react';
import Surface from '@codaco/fresco-ui/layout/Surface';
import Heading from '@codaco/fresco-ui/typography/Heading';
import Paragraph from '@codaco/fresco-ui/typography/Paragraph';
import { useFrescoLocale } from '~/i18n/FrescoI18nProvider';
import { frescoLocales, frescoTimeZone } from '~/i18n/locales';
import { frescoCatalogSource } from '~/src/locales/catalogs';

/**
 * The Fresco locale for an interface language the participant chose from the
 * interview's own menu, or the host's locale when they chose none or chose a
 * language Fresco has no catalog for.
 */
export function completionLocale(
  language: string | null | undefined,
  hostLocale: string,
) {
  return resolveAppLocale({
    stored: language ?? null,
    requested: [hostLocale],
    locales: frescoLocales,
    defaultLocale: 'en',
  }).locale;
}

function Completed() {
  return (
    <Surface className="flex h-screen flex-col items-center justify-center">
      <BadgeCheck className="text-sea-green mb-4 size-12" aria-hidden />
      <Heading level="h1">
        <AppMessage message={messages.title} />
      </Heading>
      <Paragraph>
        <AppMessage message={messages.message} />
      </Paragraph>
    </Surface>
  );
}

/**
 * The interview lets a participant switch its interface language without
 * changing Fresco's, so the thank-you page is told which language they
 * finished in and speaks that one where Fresco can.
 */
export default function InterviewCompleted({
  language,
}: {
  language?: string | null;
}) {
  const host = useFrescoLocale();
  const locale = completionLocale(language, host.locale);
  const catalog = useLocaleCatalog(frescoCatalogSource, locale);
  if (catalog.locale === host.locale) return <Completed />;
  const direction =
    frescoLocales.find((entry) => entry.locale === catalog.locale)?.direction ??
    'ltr';
  return (
    <AppI18nProvider
      locale={catalog.locale}
      locales={frescoLocales}
      messages={catalog.messages}
      timeZone={frescoTimeZone}
      manageDocument={false}
    >
      <div lang={catalog.locale} dir={direction}>
        <Completed />
      </div>
    </AppI18nProvider>
  );
}

const messages = defineMessages({
  message: {
    id: 'fresco.participantPages.interviewCompleted.message',
    defaultMessage: 'Your interview has been successfully completed.',
    description:
      'Participant-facing confirmation shown once an interview has been finished.',
  },

  title: {
    id: 'fresco.participantPages.interviewCompleted.title',
    defaultMessage: 'Thank you for participating!',
    description:
      'Participant-facing heading shown once an interview has been finished.',
  },
});
