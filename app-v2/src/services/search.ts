import type { Lesson } from './cms'

export type Row = { lessonId: number; title: string; section: 'Razlaga'|'Izzivi'|'Izboljšave'; text: string; slug?: string }
export type Ranked = Row & { score: number }

const SECTION_WEIGHT: Record<string, number> = { Razlaga: 1.0, Izzivi: 0.85, Izboljšave: 0.75 }

const SYNONYMS: Record<string, string[]> = {
  'ccs': ['contamination control strategy', 'strategija obvladovanja kontaminacije', 'kontrola kontaminacije'],
  'grade a': ['a razred', 'razred a', 'iso 5', 'aseptično območje'],
  'grade b': ['b razred', 'razred b', 'podporno ozadje'],
  'aseptic': ['aseptič', 'aseptične operacije'],
  'environmental monitoring': ['okoljski monitoring', 'monitoring okolja', 'delci', 'mikrobiološki monitoring'],
  'airflow': ['tok zraka', 'laminarni tok', 'zračni tok']
}

function tokenize(q: string) {
  return q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter(Boolean)
}

function expandQuery(tokens: string[]) {
  const out = new Set<string>(tokens)
  for (const t of tokens) {
    const syn = SYNONYMS[t]
    if (syn) syn.forEach(s => out.add(s))
  }
  return Array.from(out)
}

export function rankRows(rows: Row[], query: string): Ranked[] {
  if (!query.trim()) return []
  const baseTokens = tokenize(query)
  const expanded = expandQuery(baseTokens)
  const candidates: Ranked[] = []

  for (const r of rows) {
    const t = r.text.toLowerCase()
    let s = 0
    for (const term of expanded) {
      if (term.includes(' ')) {
        if (t.includes(term)) s += 2
      } else {
        if (t.includes(term)) s += 1
      }
    }
    s *= SECTION_WEIGHT[r.section] ?? 1
    if (s > 0) candidates.push({ ...r, score: s })
  }
  return candidates.sort((a,b)=> b.score - a.score)
}

export function summarize(rows: Row[], maxParagraphs = 3) {
  const sel = rows.slice(0, maxParagraphs)
  const bullets = sel.map(r => '• ' + r.text.slice(0, 360) + (r.text.length>360 ? '…' : ''))
  return bullets.join('\n')
}

export function collectCitations(rows: Row[]) {
  const seen = new Set<string>()
  const cites: { title: string; lessonId: number; section?: string; slug?: string }[] = []
  for (const r of rows.slice(0, 6)) {
    const key = `${r.lessonId}|${r.section}`
    if (seen.has(key)) continue
    seen.add(key)
    cites.push({ title: r.title, lessonId: r.lessonId, section: r.section, slug: r.slug })
  }
  return cites
}

export function buildRows(lessons: Lesson[]) {
  const rows: Row[] = []
  for (const l of lessons) {
    const push = (section: Row['section'], content?: string) => {
      if (!content) return
      const parts = content.split('\n').map(s=>s.trim()).filter(Boolean)
      for (const p of parts) rows.push({ lessonId: l.id, title: l.title, section, text: p, slug: l.slug })
    }
    push('Razlaga', l.developmentAndExplanation)
    push('Izzivi', l.practicalChallenges)
    push('Izboljšave', l.improvementIdeas)
  }
  return rows
}
