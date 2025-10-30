import React from 'react'
import cms from '../services/cms'
import { exportCSV } from '../utils/csv'
import ScoreChart from '../components/ScoreChart'
import { useQuizConfig } from '../contexts/QuizConfigContext'

type Attempt = Record<string, unknown>

export default function TeacherDashboard() {
  const [attempts, setAttempts] = React.useState<Attempt[]>([])
  const [loading, setLoading] = React.useState(true)
  const { currentEvent, config, setCurrentEvent, updateEventConfig } = useQuizConfig()
  const cfg = config[currentEvent]

  React.useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const a = await cms.fetchAttempts()
        if (mounted) setAttempts(a)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const avg = attempts.length ? (attempts.reduce((s,a)=>s + (Number((a as any).score) || 0), 0) / attempts.length).toFixed(2) : 'N/A'

  const downloadCSV = () => {
    const rows = attempts.map(a => ({ id: (a as any).id, user: (a as any).user, lessonId: (a as any).lesson || (a as any).lessonId || '', score: (a as any).score, startedAt: (a as any).startedAt, finishedAt: (a as any).finishedAt }))
    exportCSV('quiz-attempts.csv', rows, ['id','user','lessonId','score','startedAt','finishedAt'])
  }

  return (
    <div>
      <h2>Teacher Dashboard — Poskusi kvizov</h2>

      {/* Admin controls for quiz configuration per event */}
      <div className="card" style={{marginBottom: 20}}>
        <h3>Nastavitve kvizov (po dogodku)</h3>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,alignItems:'center'}}>
          <label style={{display:'flex',flexDirection:'column',gap:6}}>
            <span>Aktivni dogodek (ime):</span>
            <input value={currentEvent} onChange={e=>setCurrentEvent(e.target.value.trim()||'default')} placeholder="npr. interna_delavnica_marec" />
          </label>
          <div />
          <label style={{display:'flex',alignItems:'center',gap:8}}>
            <input type="checkbox" checked={cfg?.allowHints!==false} onChange={e=>updateEventConfig(currentEvent,{ allowHints: e.target.checked })} />
            Dovoli namige (💡)
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8}}>
            Maks. namigov (-1 = neomejeno):
            <input type="number" style={{width:120}} value={cfg?.maxHints ?? -1} onChange={e=>updateEventConfig(currentEvent,{ maxHints: Number(e.target.value) })} />
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8}}>
            <input type="checkbox" checked={cfg?.allowFiftyFifty!==false} onChange={e=>updateEventConfig(currentEvent,{ allowFiftyFifty: e.target.checked })} />
            Dovoli polovičko (50/50)
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8}}>
            Maks. polovičk (-1 = neomejeno):
            <input type="number" style={{width:120}} value={cfg?.maxFiftyFifty ?? -1} onChange={e=>updateEventConfig(currentEvent,{ maxFiftyFifty: Number(e.target.value) })} />
          </label>
        </div>
        <div style={{marginTop:12,fontSize:12,color:'var(--muted)'}}>
          Namig: Nastavitve se shranijo lokalno (localStorage) in veljajo za vse kvize. Lahko ustvarite različne profile za različne dogodke in preklapljate med njimi.
        </div>
      </div>
      {loading ? <p>Loading...</p> : (
        <>
          <div className="dashboard-header">
            <div>
              <p>Število poskusov: {attempts.length}</p>
              <p>Povprečni rezultat: {avg}</p>
            </div>
            <div>
              <button className="button" onClick={downloadCSV} disabled={attempts.length===0}>Export CSV</button>
            </div>
          </div>

          <ScoreChart attempts={attempts} />

          <table>
            <thead><tr><th>ID</th><th>User</th><th>Lesson</th><th>Score</th><th>At</th></tr></thead>
            <tbody>
              {attempts.map((at)=> (
                <tr key={(at as any).id}><td>{(at as any).id}</td><td>{(at as any).user}</td><td>{(at as any).lesson || (at as any).lessonId || ''}</td><td>{(at as any).score}</td><td>{((at as any).finishedAt||(at as any).id) ? new Date((at as any).finishedAt || (at as any).id).toLocaleString() : ''}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
