import React from 'react'
import InteractiveDiagram from './InteractiveDiagram'

export default function CleanroomHVACDiagram() {
  const hotspots = [
    { id: 'hepa1', x: 200, y: 120, label: 'HEPA A1', description: 'HEPA H14 – enosmerni tok, validiran PAO test, tipična hitrost 0.45 m/s' },
    { id: 'hepa2', x: 700, y: 120, label: 'HEPA A2', description: 'Stabilna enakomernost toka. Spremljanje delcev razreda A.' },
    { id: 'return1', x: 160, y: 460, label: 'Return R1', description: 'Povratni zrak pri tleh – preprečevanje recirkulacije v delovnem območju.' },
    { id: 'return2', x: 740, y: 460, label: 'Return R2', description: 'Uravnoteženje pretoka – simetrična porazdelitev povratov.' },
    { id: 'door', x: 450, y: 520, label: 'Vrata (Airlock)', description: 'DP ~15 Pa; med odpiranjem ohrani pozitivno kaskado tlaka.' },
  ]

  return (
    <InteractiveDiagram width={900} height={600} hotspots={hotspots}>
      {/* Cleanroom envelope */}
      <rect x={100} y={80} width={700} height={480} rx={10} fill="#0f172a" stroke="#334155" strokeWidth={2} />

      {/* ISO zones overlay */}
      <rect x={140} y={120} width={620} height={300} fill="#1d283780" stroke="#475569" />
      <text x={150} y={145} fontSize={12} fill="#cbd5e1">Območje delovanja (A/B)</text>

      {/* HEPA supplies (top) */}
      <g>
        <rect x={170} y={100} width={120} height={16} fill="#60a5fa" stroke="#1d4ed8" />
        <rect x={360} y={100} width={180} height={16} fill="#60a5fa" stroke="#1d4ed8" />
        <rect x={620} y={100} width={120} height={16} fill="#60a5fa" stroke="#1d4ed8" />
        <text x={420} y={95} fontSize={12} fill="#93c5fd">HEPA izpih (laminarni tok)</text>
      </g>

      {/* Flow vectors (downwards) */}
      {Array.from({ length: 10 }).map((_, i) => (
        <g key={i}>
          <line x1={180 + i * 60} y1={130} x2={180 + i * 60} y2={380} stroke="#38bdf8" strokeDasharray="6 6" />
          <polygon points={`${180 + i * 60},388 ${175 + i * 60},378 ${185 + i * 60},378`} fill="#38bdf8" />
        </g>
      ))}

      {/* Returns (bottom) */}
      <g>
        <rect x={140} y={460} width={80} height={12} fill="#10b981" stroke="#065f46" />
        <rect x={680} y={460} width={80} height={12} fill="#10b981" stroke="#065f46" />
        <text x={380} y={485} fontSize={12} fill="#86efac">Povratni zrak (rešetke)</text>
      </g>

      {/* Door */}
      <g>
        <rect x={400} y={560} width={80} height={10} fill="#22c55e" />
        <text x={360} y={555} fontSize={12} fill="#a7f3d0">Vrata (airlock) – kaskada tlaka +15 Pa</text>
      </g>

      {/* Pressure cascade arrows */}
      <g>
        <text x={820} y={240} fontSize={12} fill="#fcd34d">Višji tlak →</text>
        <line x1={800} y1={240} x2={860} y2={240} stroke="#f59e0b" strokeWidth={2} markerEnd="url(#arrow)" />
      </g>

      {/* Legend */}
      <g>
        <rect x={620} y={390} width={200} height={110} rx={8} fill="#0b1220" stroke="#334155" />
        <text x={635} y={412} fontSize={12} fill="#e2e8f0">Legenda</text>
        <circle cx={635} cy={430} r={5} fill="#60a5fa" />
        <text x={650} y={433} fontSize={12} fill="#94a3b8">HEPA izpih</text>
        <rect x={628} y={446} width={14} height={8} fill="#10b981" />
        <text x={650} y={453} fontSize={12} fill="#94a3b8">Povrat</text>
        <line x1={630} y1={468} x2={645} y2={468} stroke="#38bdf8" strokeDasharray="6 6" />
        <text x={650} y={471} fontSize={12} fill="#94a3b8">Tok zraka</text>
      </g>

      {/* Arrow marker def */}
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="5" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#f59e0b" />
        </marker>
      </defs>
    </InteractiveDiagram>
  )
}
