import React from 'react'
import { useParams } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { motion } from 'framer-motion'

export type CaseStudy = {
  title?: string
  context?: string
  problem?: string
  approach?: string[]
  results?: string[]
  metrics?: { label: string; value: string }[]
  lessonsLearned?: string[]
}

export type CaseStudyData = {
  case1?: CaseStudy
  case2?: CaseStudy
}

function parsePercent(v?: string): number | null {
  if (!v) return null
  const m = v.match(/(-?\d+(?:\.\d+)?)%/)
  if (!m) return null
  const num = parseFloat(m[1])
  // clamp 0..100 for bars; if negative, invert for display
  return Math.max(0, Math.min(100, Math.abs(num)))
}

async function exportPNG(node: HTMLElement | null) {
  if (!node) return
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(node)
  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = 'case-study.png'
  a.click()
}

async function exportPDF(node: HTMLElement | null) {
  if (!node) return
  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')
  const canvas = await html2canvas(node)
  const img = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'pt', [canvas.width, canvas.height])
  pdf.addImage(img, 'PNG', 0, 0, canvas.width, canvas.height)
  pdf.save('case-study.pdf')
}

export default function RealWorldCaseStudy() {
  const { slug } = useParams()
  const { language } = useLanguage()
  const [data, setData] = React.useState<CaseStudyData | null>(null)
  const [activeCase, setActiveCase] = React.useState<'case1' | 'case2'>('case1')
  const ref = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!slug) return
    // Load per-language JSON files by slug, fallback to default.json
    async function load() {
      try {
        const files = import.meta.glob('../content/case-studies/*/*.json', { eager: true }) as Record<string, any>
        const langPathPrefix = `/case-studies/${language}/`
        const match = Object.entries(files).find(([p]) => p.includes(langPathPrefix) && p.endsWith(`${slug}.json`))
        const fallback = Object.entries(files).find(([p]) => p.includes(langPathPrefix) && p.endsWith('default.json'))
        const picked = (match?.[1] as any) || (fallback?.[1] as any)
        const cs: CaseStudyData | undefined = picked?.default || picked
        setData(cs || null)
      } catch (e) {
        setData(null)
      }
    }
    load()
  }, [slug, language])

  if (!data || (!data.case1 && !data.case2)) return null
  
  const currentData = activeCase === 'case1' ? data.case1 : data.case2
  if (!currentData) return null

  return (
    <motion.div
      ref={ref}
      className="content-box case-study"
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, rgba(124,58,237,0.12), rgba(2,6,23,0.6))',
        border: '1px solid rgba(124,58,237,0.35)',
        borderRadius: 16,
        overflow: 'hidden'
      }}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header stripe */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute',
          top: -60,
          left: -80,
          width: 300,
          height: 300,
          background: 'radial-gradient(closest-side, rgba(124,58,237,0.35), transparent)',
          filter: 'blur(20px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: -80,
          right: -100,
          width: 320,
          height: 320,
          background: 'radial-gradient(closest-side, rgba(6,182,212,0.25), transparent)',
          filter: 'blur(20px)'
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>🧪</span>
          <h3 style={{ margin: 0, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Primer iz Prakse</h3>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => exportPNG(ref.current)} className="btn">PNG</button>
          <button onClick={() => exportPDF(ref.current)} className="btn">PDF</button>
        </div>
      </div>
      
      {/* Case selector tabs */}
      {data.case1 && data.case2 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setActiveCase('case1')}
            style={{
              padding: '8px 16px',
              background: activeCase === 'case1' ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
              border: activeCase === 'case1' ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: activeCase === 'case1' ? '#e9d5ff' : '#94a3b8',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeCase === 'case1' ? 600 : 400,
              transition: 'all 0.2s'
            }}
          >
            Primer 1
          </button>
          <button
            onClick={() => setActiveCase('case2')}
            style={{
              padding: '8px 16px',
              background: activeCase === 'case2' ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
              border: activeCase === 'case2' ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: activeCase === 'case2' ? '#e9d5ff' : '#94a3b8',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeCase === 'case2' ? 600 : 400,
              transition: 'all 0.2s'
            }}
          >
            Primer 2
          </button>
        </div>
      )}

      {currentData.title && (
        <h4 style={{ marginTop: 0, color: '#e2e8f0' }}>{currentData.title}</h4>
      )}

      {currentData.context && (
        <p style={{ color: '#cbd5e1' }}>{currentData.context}</p>
      )}

      {currentData.problem && (
        <motion.div initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35 }}>
          <div style={{
            border: '1px solid rgba(239,68,68,0.35)',
            background: 'linear-gradient(180deg, rgba(239,68,68,0.12), transparent)',
            padding: '12px 14px', borderRadius: 12, marginTop: 4
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fecdd3', marginBottom: 6 }}>
              <span>⚠️</span>
              <h5 style={{ margin: 0 }}>Problem</h5>
            </div>
            <p style={{ color: '#fecdd3', margin: 0 }}>{currentData.problem}</p>
          </div>
        </motion.div>
      )}

      {Array.isArray(currentData.approach) && currentData.approach.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: 0.05 }} style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c7d2fe', marginBottom: 6 }}>
            <span>🧩</span>
            <h5 style={{ margin: 0 }}>Pristop</h5>
          </div>
          <div style={{ position: 'relative', paddingLeft: 26 }}>
            <div style={{ position: 'absolute', left: 12, top: 0, bottom: 0, width: 2, background: 'rgba(167,139,250,0.35)' }} />
            <ul style={{ margin: 0, listStyle: 'none', padding: 0 }}>
              {currentData.approach.map((a, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 999, background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.5)', display: 'grid', placeItems: 'center', color: '#c7d2fe', fontSize: 12, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ color: '#c7d2fe' }}>{a}</div>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}

      {Array.isArray(currentData.results) && currentData.results.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: 0.1 }} style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#bbf7d0', marginBottom: 6 }}>
            <span>✅</span>
            <h5 style={{ margin: 0 }}>Rezultati</h5>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {currentData.results.map((r, i) => (
              <span key={i} style={{ padding: '6px 10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', color: '#bbf7d0', borderRadius: 999 }}>{r}</span>
            ))}
          </div>
        </motion.div>
      )}

      {Array.isArray(currentData.metrics) && currentData.metrics.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: 0.15 }} style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f1f5f9', marginBottom: 6 }}>
            <span>📈</span>
            <h5 style={{ margin: 0 }}>Metrike</h5>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {currentData.metrics.map((m, i) => {
              const pct = parsePercent(m.value)
              return (
                <div key={i} style={{ padding: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)' }}>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{m.label}</div>
                  <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: 18, marginTop: 4 }}>{m.value}</div>
                  {pct !== null && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ height: 8, background: 'rgba(148,163,184,0.25)', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#22c55e,#16a34a)' }} />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {Array.isArray(currentData.lessonsLearned) && currentData.lessonsLearned.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: 0.2 }} style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fde68a', marginBottom: 6 }}>
            <span>💡</span>
            <h5 style={{ margin: 0 }}>Kaj smo se naučili</h5>
          </div>
          <ul style={{ marginTop: 0 }}>
            {currentData.lessonsLearned.map((l, i) => (
              <li key={i} style={{ color: '#fde68a' }}>{l}</li>
            ))}
          </ul>
        </motion.div>
      )}

      <style>{`
        .btn { background:#1f2937;color:#e2e8f0;border:1px solid #334155;padding:6px 10px;border-radius:6px;cursor:pointer }
        .btn:hover { background:#334155 }
      `}</style>
    </motion.div>
  )
}
