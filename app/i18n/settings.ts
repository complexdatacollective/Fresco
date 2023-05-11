export const defaultLang = 'en'
export const languages = [defaultLang, 'es']
export const defaultNS = 'main'

export function getOptions (lng = defaultLang, ns = defaultNS) {
  return {
    // debug: true,
    supportedLngs: languages,
    defaultLang,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns
  }
}