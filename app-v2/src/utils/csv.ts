// Simple CSV exporter (no external deps)
export function exportCSV(filename: string, rows: Record<string, unknown>[], headers?: string[]) {
  if (!rows || rows.length === 0) {
    const blob = new Blob([], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    return
  }

  const keys = headers || Object.keys(rows[0])
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  const csv = [keys.join(',')].concat(rows.map(r => keys.map(k => escape(r[k])).join(','))).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

export default { exportCSV }
