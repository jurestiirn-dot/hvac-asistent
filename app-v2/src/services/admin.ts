export type AttemptOverrideMap = Record<string, number> // key: `${userId}:${lessonId}` -> allowed attempts
export type AttemptRequest = {
  id: string
  userId: string
  username: string
  lessonId: number
  createdAt: number
  status: 'pending' | 'approved' | 'rejected'
}

const OVERRIDES_KEY = 'attempt_overrides_v1'
const REQUESTS_KEY = 'attempt_requests_v1'
const CERTS_KEY = 'issued_certificates_v1'

export function getOverrideKey(userId: string, lessonId: number) {
  return `${userId}:${lessonId}`
}

export function getAllowedAttempts(userId: string, lessonId: number, defaultAllowed = 2): number {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY)
    const map: AttemptOverrideMap = raw ? JSON.parse(raw) : {}
    const key = getOverrideKey(userId, lessonId)
    return map[key] ?? defaultAllowed
  } catch {
    return defaultAllowed
  }
}

export function setAllowedAttempts(userId: string, lessonId: number, count: number) {
  const raw = localStorage.getItem(OVERRIDES_KEY)
  const map: AttemptOverrideMap = raw ? JSON.parse(raw) : {}
  const key = getOverrideKey(userId, lessonId)
  map[key] = count
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(map))
}

export function listRequests(): AttemptRequest[] {
  try {
    return JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]')
  } catch {
    return []
  }
}

export function addRequest(req: Omit<AttemptRequest,'id'|'createdAt'|'status'>): AttemptRequest {
  const existing = listRequests()
  const newReq: AttemptRequest = { id: Math.random().toString(36).slice(2), createdAt: Date.now(), status:'pending', ...req }
  localStorage.setItem(REQUESTS_KEY, JSON.stringify([newReq, ...existing]))
  return newReq
}

export function resolveRequest(id: string, action: 'approved'|'rejected', opts?: { allowedAttempts?: number }) {
  const list = listRequests()
  const idx = list.findIndex(r=>r.id===id)
  if (idx>=0) {
    const req = list[idx]
    list[idx] = { ...req, status: action }
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(list))
    if (action === 'approved' && typeof opts?.allowedAttempts === 'number') {
      setAllowedAttempts(req.userId, req.lessonId, opts.allowedAttempts)
    }
  }
}

export type Certificate = {
  id: string
  userId: string
  fullName: string
  issuedAt: number
  code: string
}

export function listCertificates(): Certificate[] {
  try { return JSON.parse(localStorage.getItem(CERTS_KEY) || '[]') } catch { return [] }
}

export function addCertificate(cert: Omit<Certificate,'id'|'issuedAt'|'code'>): Certificate {
  const list = listCertificates()
  const id = Math.random().toString(36).slice(2)
  const code = `HVAC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`
  const obj: Certificate = { id, issuedAt: Date.now(), code, ...cert }
  localStorage.setItem(CERTS_KEY, JSON.stringify([obj, ...list]))
  return obj
}
