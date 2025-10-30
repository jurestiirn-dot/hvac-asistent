import type { Language } from './cms'

export type Citation = { lessonId: number; section?: string; note?: string; slug?: string }
export type FAQEntry = {
  id: string
  patterns: string[] // phrases that if included in query, we match
  keywords?: string[]
  languages?: Language[]
  answer: string // curated, neutral and general (no copyrighted verbatim)
  citations: Citation[]
}

// Minimal curated FAQ to start; extend freely.
export const FAQ: FAQEntry[] = [
  {
    id: 'ccs-overview',
    patterns: ['ccs', 'contamination control strategy', 'strategija kontrole kontaminacije', 'strategija obvladovanja kontaminacije'],
    languages: ['sl', 'en', 'hr'],
    answer:
      'CCS (Contamination Control Strategy) je celovit, tveganjsko usmerjen pristop za obvladovanje vira in poti kontaminacije v celotnem življenjskem ciklu. V praksi zajema upoštevanje zasnove objektov/opreme, nadzor okoljskih pogojev, robustne postopke, monitoring ter stalne izboljšave. Dokumentirajte logiko odločitev, meje in odzive, da je sledljivo, kaj, zakaj in kako nadzirate.',
    citations: [
      { lessonId: 101, section: 'Razlaga' },
      { lessonId: 109, section: 'Izzivi' }
    ]
  },
  {
    id: 'grade-ab',
    patterns: ['grade a', 'grade b', 'aseptič', 'aseptic'],
    languages: ['sl', 'en', 'hr'],
    answer:
      'Grade A predstavlja lokalno okolje z najvišjo stopnjo čistosti v točki aseptičnih operacij; Grade B je neposredno ozadje, ki podpira območje A. Ključno je zagotoviti nadzorovan prezračevalni tok, fizično ločitev ter postopke, ki minimizirajo vnos in prenos kontaminantov. Monitoring mora potrjevati stabilnost pogojev pri rutini in pri najslabših primerih.',
    citations: [
      { lessonId: 120, section: 'Razlaga' },
      { lessonId: 121, section: 'Izzivi' }
    ]
  },
  {
    id: 'environmental-monitoring',
    patterns: ['environmental monitoring', 'okoljski monitoring', 'delci', 'mikrobiologija', 'airflow'],
    languages: ['sl', 'en', 'hr'],
    answer:
      'Okoljski monitoring mora biti sorazmeren tveganjem in potrjevati, da so pogoji pod nadzorom. Vključuje delce, mikrobiološke vzorce, tok zraka in površine. Največjo vrednost dajo trendi, povezani z operacijami in dogodki; pomembno je jasno definirati meje, odzive in korektivne ukrepe.',
    citations: [
      { lessonId: 130, section: 'Razlaga' },
      { lessonId: 131, section: 'Izboljšave' }
    ]
  }
]

export function matchFAQ(query: string, language: Language): FAQEntry | null {
  const q = query.toLowerCase()
  let best: { e: FAQEntry; score: number } | null = null
  for (const e of FAQ) {
    if (e.languages && !e.languages.includes(language)) continue
    let s = 0
    for (const p of e.patterns) {
      if (q.includes(p.toLowerCase())) s += 2
    }
    if (e.keywords) {
      for (const k of e.keywords) {
        if (q.includes(k.toLowerCase())) s += 1
      }
    }
    if (s > 0 && (!best || s > best.score)) best = { e, score: s }
  }
  return best?.e ?? null
}
