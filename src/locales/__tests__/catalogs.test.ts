import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  checkCatalogFreshness,
  checkCatalogLoaders,
  checkFullLocale,
  checkOverrideLocale,
  collectSourceFiles,
  extractMessages,
  readTranslationSources,
  type ExtractedCatalog,
} from '@codaco/app-i18n/catalog-guards';
import { commonMessages } from '@codaco/app-i18n/common';
import { ecosystemLocales } from '@codaco/app-i18n/locales';
import { createAppIntl } from '@codaco/app-i18n/messages';
import { frescoLocales } from '~/i18n/locales';
import {
  frescoCatalogLoaders,
  frescoCatalogSource,
} from '~/src/locales/catalogs';
import de from '~/src/locales/de.json';
import enGb from '~/src/locales/en-GB.json';
import es from '~/src/locales/es.json';
import fr from '~/src/locales/fr.json';
import italian from '~/src/locales/it.json';
import nl from '~/src/locales/nl.json';
import ptBR from '~/src/locales/pt-BR.json';
import zhHans from '~/src/locales/zh-Hans.json';
import zhHant from '~/src/locales/zh-Hant.json';

const root = resolve(import.meta.dirname, '../../..');
const sourceDirectories = [
  'actions',
  'app',
  'components',
  'hooks',
  'i18n',
  'schemas',
  'utils',
];
const en = JSON.parse(
  readFileSync(resolve(root, 'src/locales/en.json'), 'utf8'),
) as ExtractedCatalog;
const localesDir = resolve(root, 'src/locales');
const esSources = readTranslationSources(localesDir, 'es');
const zhHansSources = readTranslationSources(localesDir, 'zh-Hans');
const zhHantSources = readTranslationSources(localesDir, 'zh-Hant');
const deSources = readTranslationSources(localesDir, 'de');
const nlSources = readTranslationSources(localesDir, 'nl');
const ptBRSources = readTranslationSources(localesDir, 'pt-BR');
const italianSources = readTranslationSources(localesDir, 'it');
const frSources = readTranslationSources(localesDir, 'fr');
const enGbSources = readTranslationSources(localesDir, 'en-GB');
// What the app renders: every package's catalog for the locale, merged.
const mergedEs = await frescoCatalogSource.load('es');
const mergedEnGb = await frescoCatalogSource.load('en-GB');

describe('Fresco researcher message catalogs', () => {
  it('extracts all researcher source directories without stale, missing, or duplicate descriptors', async () => {
    const extracted = await extractMessages(
      sourceDirectories.flatMap((directory) =>
        collectSourceFiles(resolve(root, directory)),
      ),
    );
    expect(checkCatalogFreshness(en, extracted)).toEqual([]);
    expect(Object.keys(extracted).length).toBeGreaterThan(700);
    for (const id of Object.keys(extracted)) expect(id).toMatch(/^fresco\./);
  });

  it('advertises only explicitly translated ecosystem locales', () => {
    expect(frescoLocales.map(({ locale }) => locale)).toEqual([
      'en',
      'en-GB',
      'es',
      'zh-Hans',
      'zh-Hant',
      'de',
      'nl',
      'pt-BR',
      'it',
      'fr',
    ]);
    for (const { locale } of frescoLocales) {
      expect(ecosystemLocales.map((entry) => entry.locale)).toContain(locale);
    }
    // English renders from its descriptors; every other advertised locale
    // has a catalog to load, and nothing unadvertised does.
    expect(Object.keys(frescoCatalogLoaders).toSorted()).toEqual(
      frescoLocales
        .map(({ locale }) => locale)
        .filter((locale) => locale !== 'en')
        .toSorted(),
    );
  });

  it('loads each committed catalog through its own loader', async () => {
    expect(await checkCatalogLoaders(localesDir, frescoCatalogLoaders)).toEqual(
      [],
    );
  });

  it('requires complete Spanish and matching ICU arguments and rich text tags', () => {
    expect(checkFullLocale(en, es, esSources)).toEqual([]);
  });

  it('requires complete Simplified Chinese and matching ICU arguments and rich text tags', () => {
    expect(checkFullLocale(en, zhHans, zhHansSources)).toEqual([]);
  });

  it('requires complete Traditional Chinese and matching ICU arguments and rich text tags', () => {
    expect(checkFullLocale(en, zhHant, zhHantSources)).toEqual([]);
  });

  it('requires complete German and matching ICU arguments and rich text tags', () => {
    expect(checkFullLocale(en, de, deSources)).toEqual([]);
  });

  it('requires complete Dutch and matching ICU arguments and rich text tags', () => {
    expect(checkFullLocale(en, nl, nlSources)).toEqual([]);
  });

  it('requires complete Brazilian Portuguese and matching ICU arguments and rich text tags', () => {
    expect(checkFullLocale(en, ptBR, ptBRSources)).toEqual([]);
  });

  it('requires complete Italian and matching ICU arguments and rich text tags', () => {
    expect(checkFullLocale(en, italian, italianSources)).toEqual([]);
  });

  it('requires complete French and matching ICU arguments and rich text tags', () => {
    expect(checkFullLocale(en, fr, frSources)).toEqual([]);
  });

  it('keeps British English sparse with only reviewed differences', () => {
    expect(checkOverrideLocale(en, enGb, enGbSources)).toEqual([]);
    expect(Object.keys(enGb).length).toBeGreaterThan(0);
    expect(Object.keys(enGb).length).toBeLessThan(Object.keys(en).length);
    for (const [id, message] of Object.entries(enGb))
      expect(message).not.toBe(en[id]?.defaultMessage);
  });

  it('renders app and common Spanish through the merged production catalog', () => {
    const intl = createAppIntl({ locale: 'es', messages: mergedEs });
    expect(
      intl.formatMessage({
        id: 'fresco.NavigationBar.settings',
        defaultMessage: 'Settings',
        description: 'Researcher-facing NavigationBar: Settings',
      }),
    ).toBe('Configuración');
    expect(intl.formatMessage(commonMessages.cancel)).toBe('Cancelar');
  });

  it('uses the independently reviewed Spanish singular and plural count forms', () => {
    const intl = createAppIntl({ locale: 'es', messages: mergedEs });
    const interviewCounts = en['fresco.participants.table.interviewCounts'];
    const generated =
      en['fresco.settings.SyntheticInterviewDataSection.interviewsGenerated'];
    if (!interviewCounts || !generated)
      throw new Error('Expected extracted count messages');
    const countMessage = {
      ...interviewCounts,
      id: 'fresco.participants.table.interviewCounts',
    };
    const generatedMessage = {
      ...generated,
      id: 'fresco.settings.SyntheticInterviewDataSection.interviewsGenerated',
    };
    expect(intl.formatMessage(countMessage, { total: 1, completed: 1 })).toBe(
      '1 (1 completada)',
    );
    expect(intl.formatMessage(countMessage, { total: 2, completed: 2 })).toBe(
      '2 (2 completadas)',
    );
    expect(intl.formatMessage(generatedMessage, { value1: 1, value2: 1 })).toBe(
      '1 / 1 entrevista generada',
    );
    expect(intl.formatMessage(generatedMessage, { value1: 2, value2: 2 })).toBe(
      '2 / 2 entrevistas generadas',
    );
  });

  it('formats British overrides and source fallbacks in the selected locale', () => {
    const intl = createAppIntl({
      locale: 'en-GB',
      messages: mergedEnGb,
    });
    expect(
      intl.formatMessage({
        id: 'fresco.actions.auth.copyUnauthorized',
        defaultMessage: 'Unauthorized',
        description: 'Authentication error returned by the action.',
      }),
    ).toBe('Unauthorised');
    expect(
      intl.formatMessage({
        id: 'fresco.NavigationBar.settings',
        defaultMessage: 'Settings',
        description: 'Researcher-facing NavigationBar: Settings',
      }),
    ).toBe('Settings');
  });

  it('uses British self-enrol wording on both recruitment surfaces', () => {
    const recruitment = Object.entries(en).filter(([, message]) =>
      message.defaultMessage.includes('self-enroll'),
    );
    expect(recruitment).toHaveLength(2);
    const intl = createAppIntl({
      locale: 'en-GB',
      messages: mergedEnGb,
    });
    for (const [id, message] of recruitment) {
      const descriptor = { ...message, id };
      const rendered = intl.formatMessage(descriptor, {
        tag1: (chunks) => chunks.join(''),
      });
      expect(rendered).toContain('self-enrol');
      expect(rendered).not.toContain('self-enroll');
    }
  });

  it('preserves the completed-interview lockout guidance in English and Spanish', () => {
    const id = 'fresco.settings.interviews.completedLimit';
    const message = en[id];
    if (!message) throw new Error('Expected completed-interview guidance');
    const descriptor = { ...message, id };
    const values = { strong: (chunks: string[]) => chunks.join('') };
    expect(
      createAppIntl({ locale: 'en' }).formatMessage(descriptor, values),
    ).toContain(
      'starting a new interview or resuming any other incomplete interview is prevented',
    );
    expect(
      createAppIntl({
        locale: 'es',
        messages: mergedEs,
      }).formatMessage(descriptor, values),
    ).toContain(
      'no podrá iniciar una entrevista nueva ni reanudar ninguna otra entrevista incompleta',
    );
  });
});
