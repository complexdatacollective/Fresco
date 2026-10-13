import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { commonMessages } from '@codaco/app-i18n/common';
import { createAppIntl } from '@codaco/app-i18n/messages';
import { AppI18nProvider, useAppIntl } from '@codaco/app-i18n/react';
import ParticipantLayout from '~/app/(interview)/layout';
import { frescoLocales } from '~/i18n/locales';
import { frescoCatalogSource } from '~/src/locales/catalogs';

vi.mock('~/app/(interview)/_components/EndSessionRecording', () => ({
  default: () => null,
}));
// The layout's translated metadata reads the request on the server; these
// tests render the layout component only.
vi.mock('~/i18n/server', () => ({ getServerIntl: vi.fn() }));

function ParticipantContent() {
  const intl = useAppIntl();
  return (
    <button type="button">{intl.formatMessage(commonMessages.continue)}</button>
  );
}

// Loaded up front, so every render and formatter below has Spanish
// synchronously.
const es = await frescoCatalogSource.load('es');
const spanishContinue = createAppIntl({
  locale: 'es',
  messages: es,
}).formatMessage(commonMessages.continue);

describe('Fresco participant locale boundary', () => {
  // The participant pages outside the interview are translated, so they speak
  // the host's negotiated language rather than marking themselves English.
  // The interview itself remains its own boundary (see interview-host-locale).
  it('renders the real interview layout in the Spanish host language', () => {
    render(
      <AppI18nProvider locale="es" locales={frescoLocales} messages={es}>
        <ParticipantLayout>
          <ParticipantContent />
        </ParticipantLayout>
      </AppI18nProvider>,
    );
    const button = screen.getByRole('button', { name: spanishContinue });
    expect(spanishContinue).not.toBe('Continue');
    expect(button.closest('[lang]')).toBe(document.documentElement);
    expect(document.documentElement).toHaveAttribute('lang', 'es');
    expect(document.documentElement).toHaveAttribute('dir', 'ltr');
  });
});
