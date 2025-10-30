import sl from './sl'

type Translations = Record<string, unknown>

const locales: { [k:string]: Translations } = { sl }
let current: Translations = sl

export function setLocale(l: string) {
  if (locales[l]) current = locales[l]
}

export function t(path: string, fallback = ''): string {
  const parts = path.split('.')
  let cur: unknown = current
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') return fallback
    cur = (cur as Record<string, unknown>)[p]
  }
  return typeof cur === 'string' ? cur : fallback
}

export function useTranslation() {
  return { t, setLocale }
}
