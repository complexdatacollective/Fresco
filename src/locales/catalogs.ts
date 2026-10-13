import { commonCatalogLoaders } from '@codaco/app-i18n/common';
import {
  createCatalogSource,
  type CatalogLoaders,
} from '@codaco/app-i18n/locales';
import { frescoUiCatalogLoaders } from '@codaco/fresco-ui/locales';
import { networkExporterCatalogLoaders } from '@codaco/network-exporters/locales';
import { protocolUtilitiesCatalogLoaders } from '@codaco/protocol-utilities/locales';
import { protocolValidationCatalogLoaders } from '@codaco/protocol-validation/locales';

/**
 * Fresco's own researcher catalogs, one loader per translated locale. English
 * has no entry: every descriptor carries its `defaultMessage`, so `en.json` is
 * extraction data for translators and the freshness guard, never a runtime
 * input.
 */
export const frescoCatalogLoaders: CatalogLoaders = {
  'en-GB': () => import('~/src/locales/en-GB.json'),
  'es': () => import('~/src/locales/es.json'),
  'zh-Hans': () => import('~/src/locales/zh-Hans.json'),
  'zh-Hant': () => import('~/src/locales/zh-Hant.json'),
  'de': () => import('~/src/locales/de.json'),
  'nl': () => import('~/src/locales/nl.json'),
  'pt-BR': () => import('~/src/locales/pt-BR.json'),
  'it': () => import('~/src/locales/it.json'),
  'fr': () => import('~/src/locales/fr.json'),
};

/**
 * Every message Fresco renders, merged common → shared packages → app and
 * loaded one locale at a time. Each language is its own chunk, so no route's
 * bundle carries a catalog: the server loads the request's locale and hands
 * it to the client as props, and the client downloads another only when a
 * researcher switches to it.
 */
export const frescoCatalogSource = createCatalogSource(
  commonCatalogLoaders,
  frescoUiCatalogLoaders,
  networkExporterCatalogLoaders,
  protocolUtilitiesCatalogLoaders,
  protocolValidationCatalogLoaders,
  frescoCatalogLoaders,
);
