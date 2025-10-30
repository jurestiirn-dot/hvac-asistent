import axios, { AxiosInstance } from 'axios'
import sample from '../content/sample-lesson.json'
import { getToken } from './auth'

// Language type
export type Language = 'sl' | 'en' | 'hr'

// Dynamic imports for lesson files
async function getLessonsForLanguage(language: Language) {
  try {
    const mainLessons = await import(`../content/annex1-${language}.json`)
    const advancedLessons = await import(`../content/annex1-advanced-${language}.json`)
    return {
      main: mainLessons.default,
      advanced: advancedLessons.default
    }
  } catch (error) {
    console.warn(`Could not load lessons for language ${language}, falling back to Slovenian`)
    // Fallback to Slovenian if language files don't exist
    const mainLessons = await import('../content/annex1.json')
    const advancedLessons = await import('../content/annex1-advanced.json')
    return {
      main: mainLessons.default,
      advanced: advancedLessons.default
    }
  }
}

// Vite exposes env via import.meta.env; narrow type safely
const STRAPI_URL = ((import.meta as unknown) as { env?: { VITE_STRAPI_URL?: string } }).env?.VITE_STRAPI_URL || ''

const api: AxiosInstance = axios.create({
  baseURL: STRAPI_URL || undefined,
})

// Keep interceptor argument loosely typed to avoid axios typing friction here
api.interceptors.request.use((cfg: any) => {
  const token = getToken()
  if (token) cfg.headers = { ...(cfg.headers || {}), Authorization: `Bearer ${token}` }
  return cfg
})

export type Lesson = {
  id: number
  title: string
  slug: string
  annexReference?: string
  developmentAndExplanation?: string
  practicalChallenges?: string
  improvementIdeas?: string
  visualComponent?: string
  quizQuestions?: unknown[]
}

// Basic client that uses Strapi when VITE_STRAPI_URL is set, otherwise uses mock data

// Normalize terminology: Always use the official name "Annex 1" (no translation)
// Examples seen in content: "DPP Dodatek 1", "GMP dodatek 1", "Appendix 1", "Prilog 1", "Dodatak 1", "Aneks 1".
// We standardize to:
// - "EU GMP Annex 1" when a GMP/DPP qualifier is present
// - "Annex 1" for standalone mentions
function normalizeAnnexTerminologyText(input: string): string {
  let s = input
  // Qualified forms (keep EU GMP qualifier)
  s = s.replace(/\b(?:DPP|EU\s*GMP|GMP)\s+(?:Dodatek\w*|Dodatak\w*|Prilog\w*)\s*1\b/gi, 'EU GMP Annex 1')
  s = s.replace(/\bDPP\s+Appendix\s*1\b/gi, 'EU GMP Annex 1')
  // Standalone localized/incorrect forms → Annex 1
  s = s.replace(/\bAppendix\s*1\b/gi, 'Annex 1')
  s = s.replace(/\bAneks(?:acija)?\s*1\b/gi, 'Annex 1')
  s = s.replace(/\bDodatek\w*\s*1\b/gi, 'Annex 1')
  s = s.replace(/\bDodatak\w*\s*1\b/gi, 'Annex 1')
  s = s.replace(/\bPrilog\w*\s*1\b/gi, 'Annex 1')
  // Minor cleanup: collapse duplicate spaces that might result from replacements
  s = s.replace(/\s{2,}/g, ' ')
  return s
}

function deepNormalizeAnnexTerminology<T>(value: T): T {
  if (typeof value === 'string') {
    return normalizeAnnexTerminologyText(value) as unknown as T
  }
  if (Array.isArray(value)) {
    return value.map(v => deepNormalizeAnnexTerminology(v)) as unknown as T
  }
  if (value && typeof value === 'object') {
    const out: any = Array.isArray(value) ? [] : {}
    for (const [k, v] of Object.entries(value as any)) {
      out[k] = deepNormalizeAnnexTerminology(v as any)
    }
    return out
  }
  return value
}

export async function login(username: string, password: string) {
  try {
    if (!STRAPI_URL) {
      // mock login: accept any credentials and return mock token
      return { jwt: 'mock-jwt-token', user: { username, role: 'student' } }
    }

    const res = await api.post(`/api/auth/local`, { identifier: username, password })
    return res.data
  } catch (error: any) {
    console.error('Login error:', error)
    throw new Error(
      error.response?.data?.error?.message || 
      'Prijava ni uspela. Preverite uporabniško ime in geslo.'
    )
  }
}

export async function fetchLessons(language: Language = 'sl'): Promise<Lesson[]> {
  try {
    if (!STRAPI_URL) {
      // Load lessons for the specified language
      const lessons = await getLessonsForLanguage(language)
      const allLessonsRaw = [...(lessons.main as Lesson[]), ...(lessons.advanced as Lesson[])]
      // Normalize incorrect "Annex 1" translations across all string fields
      const allLessons = allLessonsRaw.map(l => deepNormalizeAnnexTerminology(l)) as Lesson[]
      return allLessons.sort((a, b) => a.id - b.id)
    }

    const res = await api.get(`/api/lessons?populate=deep`)
    // adapt to Strapi response shape
    return res.data.data.map((d: unknown) => ({ id: (d as any).id, ...((d as any).attributes) }))
  } catch (error: any) {
    console.error('Fetch lessons error:', error)
    throw new Error('Ni bilo mogoče naložiti lekcij. Preverite internetno povezavo.')
  }
}

export async function fetchLessonBySlug(slug: string, language: Language = 'sl'): Promise<Lesson | null> {
  try {
    if (!STRAPI_URL) {
      // Load lessons for the specified language
      const lessons = await getLessonsForLanguage(language)
      const allLessonsRaw = [...(lessons.main as Lesson[]), ...(lessons.advanced as Lesson[])]
      const allLessons = allLessonsRaw.map(l => deepNormalizeAnnexTerminology(l)) as Lesson[]
      const lesson = allLessons.find(l => l.slug === slug)
      return lesson || null
    }

    const res = await api.get(`/api/lessons?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=deep`)
    const data = res.data.data[0]
    if (!data) return null
    return { id: data.id, ...data.attributes }
  } catch (error: any) {
    console.error('Fetch lesson error:', error)
    throw new Error('Ni bilo mogoče naložiti lekcije. Preverite internetno povezavo.')
  }
}

export async function submitQuizAttempt(payload: Record<string, unknown>, token?: string) {
  try {
    if (!STRAPI_URL) {
      // mock persistence: save to localStorage
      const attempts = JSON.parse(localStorage.getItem('mock_attempts') || '[]')
      const attempt = { ...payload, id: Date.now() }
      attempts.push(attempt)
      localStorage.setItem('mock_attempts', JSON.stringify(attempts))
      return { success: true, attempt }
    }

    // Strapi expects { data: { ... } }
    const res = await api.post(`/api/quiz-attempts`, { data: payload })
    return res.data
  } catch (error: any) {
    console.error('Submit quiz error:', error)
    throw new Error('Kviz ni bilo mogoče oddati. Poskusite ponovno.')
  }
}

export async function fetchAttempts(): Promise<Record<string, unknown>[]> {
  try {
    if (!STRAPI_URL) {
      return JSON.parse(localStorage.getItem('mock_attempts') || '[]')
    }
    const res = await api.get(`/api/quiz-attempts?populate=deep`)
    return res.data.data.map((d: unknown) => ({ id: (d as any).id, ...((d as any).attributes) }))
  } catch (error: any) {
    console.error('Fetch attempts error:', error)
    throw new Error('Ni bilo mogoče naložiti poskusov kviza.')
  }
}

export function addAttemptComment(userId: string, lessonId: number, comment: string) {
  try {
    const attempts: any[] = JSON.parse(localStorage.getItem('mock_attempts') || '[]')
    // Find latest attempt for this user/lesson
    const idx = [...attempts]
      .map((a, i) => ({ i, a }))
      .filter(({ a }) => (a.userId === userId) && (a.lessonId === lessonId))
      .sort((x, y) => (y.a.finishedAt || y.a.id || 0) - (x.a.finishedAt || x.a.id || 0))[0]?.i
    if (idx != null) {
      attempts[idx] = { ...attempts[idx], comment }
      localStorage.setItem('mock_attempts', JSON.stringify(attempts))
      return true
    }
  } catch (e) {
    console.error('addAttemptComment failed', e)
  }
  return false
}

// re-export default shape for existing imports
export default { login, fetchLessons, fetchLessonBySlug, submitQuizAttempt, fetchAttempts, addAttemptComment }
