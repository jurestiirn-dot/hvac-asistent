export type GlobalAnswer = {
  answer: string
  citations: { title: string; url: string }[]
}

// Use relative path if no env override; Vite proxies /api -> localhost:3001 in dev
const BASE = import.meta.env.VITE_KNOWLEDGE_API_BASE || ''

export async function askGlobalKnowledge(query: string, k = 5): Promise<GlobalAnswer> {
  const endpoint = `${BASE}/api/knowledge/ask`
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, k })
  })
  if (!resp.ok) {
    throw new Error(`Knowledge service error: ${resp.status}`)
  }
  return resp.json()
}

export async function askVectorKnowledge(q: string, k = 5, sources: string[] = []): Promise<GlobalAnswer> {
  const endpoint = `${BASE}/api/knowledge/search`
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, k, sources })
  })
  if (!resp.ok) {
    throw new Error(`Vector search error: ${resp.status}`)
  }
  return resp.json()
}
