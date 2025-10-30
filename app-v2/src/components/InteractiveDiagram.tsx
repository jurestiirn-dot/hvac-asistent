import React from 'react'

type Hotspot = {
  id: string
  x: number
  y: number
  label: string
  description?: string
}

export interface InteractiveDiagramProps {
  width?: number
  height?: number
  background?: string
  children?: React.ReactNode
  hotspots?: Hotspot[]
  onHotspotClick?: (h: Hotspot) => void
}

export default function InteractiveDiagram({
  width = 900,
  height = 600,
  background = '#0b1220',
  children,
  hotspots = [],
  onHotspotClick,
}: InteractiveDiagramProps) {
  const svgRef = React.useRef<SVGSVGElement | null>(null)
  const [view, setView] = React.useState({ x: 0, y: 0, scale: 1 })
  const [drag, setDrag] = React.useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false })
  const [activeHotspot, setActiveHotspot] = React.useState<string | null>(null)
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [smallWidth, setSmallWidth] = React.useState(false)

  const onWheel: React.WheelEventHandler<SVGSVGElement> = (e) => {
    e.preventDefault()
    const rect = svgRef.current?.getBoundingClientRect()
    const cx = (e.clientX - (rect?.left || 0) - view.x) / view.scale
    const cy = (e.clientY - (rect?.top || 0) - view.y) / view.scale
    const delta = -Math.sign(e.deltaY) * 0.1
    const newScale = Math.min(4, Math.max(0.4, view.scale * (1 + delta)))
    const nx = (e.clientX - (rect?.left || 0)) - cx * newScale
    const ny = (e.clientY - (rect?.top || 0)) - cy * newScale
    setView({ x: nx, y: ny, scale: newScale })
  }

  const onPointerDown: React.PointerEventHandler<SVGSVGElement> = (e) => {
    setDrag({ x: e.clientX - view.x, y: e.clientY - view.y, active: true })
  }
  const onPointerMove: React.PointerEventHandler<SVGSVGElement> = (e) => {
    if (!drag.active) return
    setView((v) => ({ ...v, x: e.clientX - drag.x, y: e.clientY - drag.y }))
  }
  const onPointerUp: React.PointerEventHandler<SVGSVGElement> = () => {
    setDrag((d) => ({ ...d, active: false }))
  }

  const reset = () => setView({ x: 0, y: 0, scale: 1 })

  // Fullscreen helpers
  const enterFullscreen = async () => {
    try {
      await containerRef.current?.requestFullscreen()
    } catch {}
  }
  React.useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])
  React.useEffect(() => {
    const onResize = () => setSmallWidth((containerRef.current?.clientWidth || width) < 800)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [width])

  return (
  <div ref={containerRef} style={{ position: 'relative', background, border: '1px solid #1f2937', borderRadius: 8 }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ touchAction: 'none', cursor: drag.active ? 'grabbing' : 'grab', display: 'block' }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <defs>
          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.25" />
          </filter>
        </defs>
        <g transform={`translate(${view.x},${view.y}) scale(${view.scale})`}>
          {/* Diagram content */}
          {children}

          {/* Hotspots */}
          {hotspots.map((h) => (
            <g key={h.id} onClick={() => { setActiveHotspot(h.id); onHotspotClick?.(h) }} style={{ pointerEvents: 'all' }}>
              <circle cx={h.x} cy={h.y} r={8} fill="#22c55e" stroke="#052e16" strokeWidth={2} filter="url(#softShadow)" />
              <text x={h.x + 12} y={h.y + 4} fontSize={12} fill="#e2e8f0" style={{ userSelect: 'none' }}>{h.label}</text>
            </g>
          ))}
        </g>
      </svg>

      {/* UI overlay */}
      <div style={{ position: 'absolute', right: 12, top: 12, display: 'flex', gap: 8 }}>
        <button onClick={() => setView((v) => ({ ...v, scale: Math.min(4, v.scale * 1.2) }))} className="btn">+</button>
        <button onClick={() => setView((v) => ({ ...v, scale: Math.max(0.4, v.scale / 1.2) }))} className="btn">-</button>
        <button onClick={reset} className="btn">Reset</button>
        <button onClick={enterFullscreen} className="btn">⛶</button>
        <button onClick={() => downloadPNG(containerRef.current)} className="btn">PNG</button>
        <button onClick={() => downloadPDF(containerRef.current)} className="btn">PDF</button>
      </div>

      {activeHotspot && (
        <div style={{ position: 'absolute', left: 12, bottom: 12, maxWidth: 360, background: '#0b1220', border: '1px solid #334155', padding: 12, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>{hotspots.find(h => h.id === activeHotspot)?.label}</strong>
            <button onClick={() => setActiveHotspot(null)} className="btn">✕</button>
          </div>
          <p style={{ color: '#94a3b8', marginTop: 8 }}>
            {hotspots.find(h => h.id === activeHotspot)?.description || 'Ni opisa.'}
          </p>
        </div>
      )}

      {smallWidth && !isFullscreen && (
        <div style={{ position: 'absolute', left: 12, top: 12, background:'#0b1220', border:'1px solid #334155', padding:10, borderRadius:8 }}>
          <div style={{ color:'#e2e8f0', fontSize:12, marginBottom:6 }}>Za boljši pregled odpri celozaslonski način.</div>
          <button onClick={enterFullscreen} className="btn">Odpri Celozaslonsko</button>
        </div>
      )}

      <style>{`
        .btn { background:#1f2937;color:#e2e8f0;border:1px solid #334155;padding:6px 10px;border-radius:6px;cursor:pointer }
        .btn:hover { background:#334155 }
      `}</style>
    </div>
  )
}

async function downloadPNG(container: HTMLElement | null) {
  if (!container) return
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(container)
  const dataUrl = canvas.toDataURL('image/png')
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = 'diagram.png'
  a.click()
}

async function downloadPDF(container: HTMLElement | null) {
  if (!container) return
  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')
  const canvas = await html2canvas(container)
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('l', 'pt', [canvas.width, canvas.height])
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
  pdf.save('diagram.pdf')
}
