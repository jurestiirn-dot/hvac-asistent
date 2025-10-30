import SL from '../i18n/sl';

type Translations = { [k: string]: any };

let locale = 'sl';
let translations: Translations = SL;

export function setLocale(l: string) {
  // for now we only ship Slovenian; extend later to load dynamically
  locale = l;
  if (l === 'sl') translations = SL;
}

export function t(path: string, fallback = ''): string {
  const parts = path.split('.');
  let cur: any = translations;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') return fallback;
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur : fallback;
}

export default { setLocale, t };
