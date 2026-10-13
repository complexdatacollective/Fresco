'use client';

import LocaleSwitcher, {
  type LocaleSwitcherProps,
} from '@codaco/fresco-ui/navigation/LocaleSwitcher';
import { useFrescoLocale } from '~/i18n/FrescoI18nProvider';
import { frescoLocales } from '~/i18n/locales';

type FrescoLocaleSwitcherProps = Pick<
  LocaleSwitcherProps,
  'variant' | 'color' | 'size' | 'className' | 'renderTrigger' | 'display'
>;

/** The globe button that sets the interface language. */
export default function FrescoLocaleSwitcher({
  display = 'icon',
  ...props
}: FrescoLocaleSwitcherProps) {
  const { preference, automaticLocale, saveState, persistence, setLocale } =
    useFrescoLocale();
  return (
    <LocaleSwitcher
      {...props}
      options={frescoLocales}
      value={preference}
      automaticLocale={automaticLocale}
      searchable
      onChange={setLocale}
      saveState={saveState}
      persistence={persistence}
      display={display}
    />
  );
}
