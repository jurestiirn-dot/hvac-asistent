import React from 'react'
import { useParams } from 'react-router-dom'
import InteractiveDiagram from './InteractiveDiagram'

type Config = {
  background?: string
  layers?: { zones?: boolean; flows?: boolean; hotspots?: boolean; legend?: boolean }
  zones?: { x: number; y: number; width: number; height: number; fill: string; label?: string }[]
  flows?: { from: [number, number]; to: [number, number]; color?: string }[]
  hotspots?: { id: string; x: number; y: number; label: string; description?: string; anchor?: string }[]
  legend?: { label: string; color?: string; line?: string }[]
}

export default function ThematicDiagram() {
  const { slug } = useParams()
  const [cfg, setCfg] = React.useState<Config | null>(null)
  const [layers, setLayers] = React.useState({ zones: true, flows: true, hotspots: true, legend: true })

  // Load config by slug
  React.useEffect(() => {
    const files = import.meta.glob('../diagrams/*.json', { eager: true }) as Record<string, any>
    // Pick by filename match, fallback to default.json
    const entry = Object.entries(files).find(([path]) => path.includes(`/${slug}.json`))
    const fallback = Object.entries(files).find(([path]) => path.endsWith('/default.json'))
    const data: Config | undefined = (entry?.[1] as any)?.default || (entry?.[1]) || (fallback?.[1] as any)?.default || (fallback?.[1])
    if (data) {
      setCfg(data)
      const l = data.layers || {}
      setLayers({ zones: l.zones ?? true, flows: l.flows ?? true, hotspots: l.hotspots ?? true, legend: l.legend ?? true })
    } else {
      setCfg(null)
    }
  }, [slug])

  const onHotspotClick = (h: { id: string; label: string; anchor?: string }) => {
    const anchor = h.anchor || h.label
    window.dispatchEvent(new CustomEvent('scroll-to-anchor', { detail: { anchor, closeModal: true } }))
  }

  const background = cfg?.background || '#0f172a'

  return (
    <div style={{ position: 'relative' }}>
      {/* Layer toggles top-left; avoid overlap by staying on top-left corner */}
      <div style={{ position: 'absolute', left: 12, top: 12, zIndex: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['zones','flows','hotspots','legend'] as const).map(key => (
          <label key={key} style={{ background:'#0b1220', border:'1px solid #334155', padding:'6px 8px', borderRadius:6, color:'#e2e8f0', fontSize:12 }}>
            <input type="checkbox" checked={(layers as any)[key]} onChange={(e) => setLayers(s => ({ ...s, [key]: e.currentTarget.checked }))} style={{ marginRight:6 }} />
            {key}
          </label>
        ))}
      </div>

      <InteractiveDiagram width={900} height={560} background={background} hotspots={(layers.hotspots ? (cfg?.hotspots || []) : []) as any} onHotspotClick={onHotspotClick}>
        {/* Base canvas frame */}
        <rect x={60} y={80} width={780} height={380} rx={10} fill={background} stroke="#334155" strokeWidth={2} />

        {/* Zones */}
        {layers.zones && cfg?.zones?.length && (
          <g opacity={0.5}>
            {cfg.zones.map((z, i) => (
              <g key={i}>
                <rect x={z.x} y={z.y} width={z.width} height={z.height} fill={z.fill} />
                {z.label && <text x={z.x + 12} y={z.y + 20} fontSize={12} fill="#e2e8f0">{z.label}</text>}
              </g>
            ))}
          </g>
        )}

        {/* Flows */}
        <defs>
          <marker id="arrow-thematic" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 10 3, 0 6" fill="#f59e0b" />
          </marker>
        </defs>
        {layers.flows && cfg?.flows?.length && (
          <g>
            {cfg.flows.map((f, i) => (
              <line key={i} x1={f.from[0]} y1={f.from[1]} x2={f.to[0]} y2={f.to[1]} stroke={f.color || '#f59e0b'} strokeWidth={2} markerEnd="url(#arrow-thematic)" />
            ))}
          </g>
        )}

        {/* Legend - position bottom-right; if a hotspot panel is open (handled in InteractiveDiagram), they are on opposite corners to avoid overlap */}
        {layers.legend && cfg?.legend?.length && (
          <g>
            <rect x={640} y={360} width={180} height={90} rx={8} fill="#0b1220" stroke="#334155" />
            <text x={655} y={382} fontSize={12} fill="#e2e8f0">Legenda</text>
            {cfg.legend.map((it, i) => (
              <g key={i}>
                {it.color && <rect x={648} y={394 + i*18} width={12} height={12} fill={it.color} />}
                {it.line && <line x1={648} y1={400 + i*18} x2={660} y2={400 + i*18} stroke={it.line} strokeWidth={2} />}
                <text x={666} y={404 + i*18} fontSize={12} fill="#94a3b8">{it.label}</text>
              </g>
            ))}
          </g>
        )}
      </InteractiveDiagram>
    </div>
  )
}
