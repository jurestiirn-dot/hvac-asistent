// Chat service for Gemini Flash conversational mode
const BASE = import.meta.env.VITE_KNOWLEDGE_API_BASE || 'http://localhost:3001'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  answer: string
  model: string
  tokensUsed?: { totalTokenCount: number }
}

export interface ChatContext {
  sources?: Array<{ source: string; title: string; text?: string }>
  lesson?: string
}

/**
 * Send chat completion request to Gemini Flash backend
 */
export async function chatCompletion(
  messages: ChatMessage[],
  context?: ChatContext
): Promise<ChatResponse> {
  const resp = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context })
  })
  
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `Chat failed: ${resp.status}`)
  }
  
  return resp.json()
}

/**
 * Check if chat mode is available (backend has Gemini configured)
 */
export async function isChatAvailable(): Promise<boolean> {
  try {
    const resp = await fetch(`${BASE}/api/health`)
    if (!resp.ok) return false
    const health = await resp.json()
    return health.gemini === true
  } catch {
    return false
  }
}

/**
 * Set API key at runtime (dev helper; does not persist)
 */
export async function setChatApiKey(apiKey: string): Promise<boolean> {
  const resp = await fetch(`${BASE}/api/chat/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey })
  })
  if (!resp.ok) return false
  const out = await resp.json()
  return !!out.ok && out.gemini === true
}
