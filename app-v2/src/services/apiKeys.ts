export interface PoolKey {
  key: string
  assignedTo?: string
  assignedAt?: number
}

const STORAGE_KEY = 'hvac_api_keys_pool'

function getPool(): PoolKey[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as PoolKey[] : []
  } catch {
    return []
  }
}

function savePool(pool: PoolKey[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pool))
}

export function listKeys(): PoolKey[] {
  return getPool()
}

export function stats() {
  const pool = getPool()
  const used = pool.filter(k => !!k.assignedTo).length
  const free = pool.length - used
  return { total: pool.length, used, free }
}

export function getFreeKeys(): PoolKey[] {
  return getPool().filter(k => !k.assignedTo)
}

export function findKey(key: string): PoolKey | undefined {
  return getPool().find(k => k.key === key)
}

export function addKeys(keys: string[]): { added: number; skipped: number } {
  const pool = getPool()
  const existing = new Set(pool.map(k => k.key))
  let added = 0
  keys.forEach(k => {
    const key = k.trim()
    if (!key || existing.has(key)) return
    pool.push({ key })
    existing.add(key)
    added++
  })
  savePool(pool)
  return { added, skipped: keys.length - added }
}

export function deleteKey(key: string): boolean {
  const pool = getPool()
  const idx = pool.findIndex(k => k.key === key)
  if (idx === -1) return false
  pool.splice(idx, 1)
  savePool(pool)
  return true
}

export function assignKey(key: string, userId: string): boolean {
  const pool = getPool()
  const item = pool.find(k => k.key === key)
  if (!item) return false
  item.assignedTo = userId
  item.assignedAt = Date.now()
  savePool(pool)
  return true
}

export function unassignKey(key: string): boolean {
  const pool = getPool()
  const item = pool.find(k => k.key === key)
  if (!item) return false
  delete item.assignedTo
  delete item.assignedAt
  savePool(pool)
  return true
}

export function assignNextFree(userId: string): PoolKey | undefined {
  const pool = getPool()
  const item = pool.find(k => !k.assignedTo)
  if (!item) return undefined
  item.assignedTo = userId
  item.assignedAt = Date.now()
  savePool(pool)
  return item
}

// Utilities: backup/restore and bulk operations

export function exportPool(pretty = true): string {
  const pool = getPool()
  return JSON.stringify(pool, null, pretty ? 2 : 0)
}

// Accepts either an array of strings (keys) or PoolKey objects
export function importPool(json: string, mode: 'merge' | 'replace' = 'merge'):
  { added: number; skipped: number; replaced: number } {
  let incoming: Array<PoolKey | string> = []
  try {
    const parsed = JSON.parse(json)
    if (Array.isArray(parsed)) incoming = parsed
    else throw new Error('Invalid JSON: expected an array')
  } catch {
    return { added: 0, skipped: 0, replaced: 0 }
  }

  // Normalize to PoolKey[]
  const normalized: PoolKey[] = incoming
    .map((item) => {
      if (typeof item === 'string') {
        const key = item.trim()
        return key ? { key } : undefined
      }
      if (item && typeof item === 'object' && typeof (item as any).key === 'string') {
        const k = (item as any).key.trim()
        if (!k) return undefined
        const pk: PoolKey = { key: k }
        if ((item as any).assignedTo) pk.assignedTo = String((item as any).assignedTo)
        if ((item as any).assignedAt) pk.assignedAt = Number((item as any).assignedAt)
        return pk
      }
      return undefined
    })
    .filter((x): x is PoolKey => !!x)

  if (mode === 'replace') {
    savePool(normalized)
    return { added: normalized.length, skipped: 0, replaced: 1 }
  }

  const pool = getPool()
  const existing = new Set(pool.map(k => k.key))
  let added = 0
  let skipped = 0
  for (const item of normalized) {
    if (!item.key || existing.has(item.key)) { skipped++; continue }
    pool.push({ key: item.key, assignedTo: item.assignedTo, assignedAt: item.assignedAt })
    existing.add(item.key)
    added++
  }
  savePool(pool)
  return { added, skipped, replaced: 0 }
}

export function unassignAll(): number {
  const pool = getPool()
  let count = 0
  for (const item of pool) {
    if (item.assignedTo) {
      delete item.assignedTo
      delete item.assignedAt
      count++
    }
  }
  savePool(pool)
  return count
}

export function deleteAllFree(): number {
  const pool = getPool()
  const before = pool.length
  const kept = pool.filter(k => !!k.assignedTo)
  savePool(kept)
  return before - kept.length
}
