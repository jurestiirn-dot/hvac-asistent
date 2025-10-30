import React from 'react'
import cms from '../services/cms'
import QuizConfigAdmin from '../components/QuizConfigAdmin'
import { listRequests, resolveRequest, getAllowedAttempts, setAllowedAttempts, listCertificates, addCertificate } from '../services/admin'
import { useAuth } from '../context/AuthContext'

import Certificate from '../components/Certificate'
import {
  type PoolKey,
  addKeys as poolAddKeys,
  listKeys as poolListKeys,
  stats as poolStatsFn,
  getFreeKeys as poolGetFreeKeys,
  findKey as poolFindKey,
  deleteKey as poolDeleteKey,
  assignKey as poolAssignKey,
  unassignKey as poolUnassignKey,
  assignNextFree as poolAssignNextFree,
  exportPool as poolExport,
  importPool as poolImport,
  unassignAll as poolUnassignAll,
  deleteAllFree as poolDeleteAllFree,
} from '../services/apiKeys'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = React.useState<'settings'|'requests'|'attempts'|'users'|'apikeys'|'certs'|'lessons'>('settings')
  const [attempts, setAttempts] = React.useState<any[]>([])
  const [requests, setRequests] = React.useState(listRequests())
  const [users, setUsers] = React.useState<any[]>([])
  const [editUser, setEditUser] = React.useState<null | any>(null)
  const [lessons, setLessons] = React.useState<any[]>([])
  const [certs, setCerts] = React.useState(listCertificates())
  const [previewCert, setPreviewCert] = React.useState<null | { fullName: string; code: string }>(null)
  const [drillUser, setDrillUser] = React.useState<null | any>(null)
  const [manageLessonsUser, setManageLessonsUser] = React.useState<null | any>(null)
  const { updateUserRole, updateUserApiKey, updateUserLessons, user: currentUser } = useAuth()
  // API keys pool state
  const [pool, setPool] = React.useState<PoolKey[]>([])
  const [poolStats, setPoolStats] = React.useState<{ total: number; used: number; free: number }>({ total: 0, used: 0, free: 0 })
  const [bulkKeysText, setBulkKeysText] = React.useState('')
  const fileInputRef = React.useRef<HTMLInputElement|null>(null)

  React.useEffect(()=>{
    (async ()=>{
      setAttempts(await cms.fetchAttempts())
      setUsers(JSON.parse(localStorage.getItem('hvac_registered_users')||'[]'))
      setLessons(await cms.fetchLessons('sl' as any))
    })()
  },[])

  const refreshPool = ()=>{
    setPool(poolListKeys())
    setPoolStats(poolStatsFn())
  }

  const refresh = async ()=>{
    setAttempts(await cms.fetchAttempts())
    setRequests(listRequests())
    setCerts(listCertificates())
    refreshPool()
  }

  const passingByUser: Record<string, Set<number>> = React.useMemo(()=>{
    const map: Record<string, Set<number>> = {}
    attempts.forEach((a: any)=>{
      const uid = a.userId || a.user || 'anon'
      const lid = a.lessonId || a.lesson
      const total = a.totalQuestions || 0
      const score = Number(a.score)||0
      const pct = total ? (score/total)*100 : (score>0?100:0)
      const passed = pct >= 55
      if (passed && lid!=null) {
        map[uid] = map[uid] || new Set<number>()
        map[uid].add(Number(lid))
      }
    })
    return map
  },[attempts])

  const lessonsWithQuiz = React.useMemo(()=> lessons.filter(l=>Array.isArray(l.quizQuestions) && l.quizQuestions.length>0),[lessons])
  const lessonTitleById: Record<number, string> = React.useMemo(()=>{
    const m: Record<number, string> = {}
    lessons.forEach((l:any)=>{ if (l?.id!=null) m[l.id] = l.title || `Lekcija ${l.id}` })
    return m
  },[lessons])

  const canIssueCert = (userId: string)=>{
    const passed = passingByUser[userId]?.size || 0
    return passed>0 && passed === lessonsWithQuiz.length && lessonsWithQuiz.length>0
  }

  return (
    <div className="page" style={{padding:24}}>
      <h2>🛠️ Admin nadzorna plošča</h2>
      <div style={{display:'flex',gap:8, margin:'12px 0', flexWrap:'wrap'}}>
        <button className={activeTab==='settings'? 'button active':'button'} onClick={()=>setActiveTab('settings')}>⚙️ Nastavitve kviza</button>
        <button className={activeTab==='requests'? 'button active':'button'} onClick={()=>{ setRequests(listRequests()); setActiveTab('requests')}}>📬 Prošnje</button>
        <button className={activeTab==='attempts'? 'button active':'button'} onClick={()=>{ setActiveTab('attempts')}}>📝 Poskusi</button>
        <button className={activeTab==='users'? 'button active':'button'} onClick={()=>{setUsers(JSON.parse(localStorage.getItem('hvac_registered_users')||'[]')); setActiveTab('users')}}>👥 Uporabniki</button>
        <button className={activeTab==='lessons'? 'button active':'button'} onClick={()=>{setUsers(JSON.parse(localStorage.getItem('hvac_registered_users')||'[]')); setActiveTab('lessons')}}>📚 Upravljanje lekcij</button>
  <button className={activeTab==='apikeys'? 'button active':'button'} onClick={()=>{setUsers(JSON.parse(localStorage.getItem('hvac_registered_users')||'[]')); refreshPool(); setActiveTab('apikeys')}}>🔑 AI API Ključi</button>
        <button className={activeTab==='certs'? 'button active':'button'} onClick={()=>{ setCerts(listCertificates()); setActiveTab('certs')}}>🎓 Certifikati</button>
      </div>

      {activeTab==='settings' && (
        <div className="card">
          <QuizConfigAdmin />
        </div>
      )}
      {activeTab==='apikeys' && (
        <div className="card">
          <h3>🔑 AI API Ključi Uporabnikov</h3>
          <p style={{color:'#94a3b8', marginBottom:20}}>
            Dodeli vsem uporabnikom njihov AI API ključ za dostop do AI funkcionalnosti.
          </p>
          <div style={{display:'grid', gap:12, marginBottom:16}}>
            <div style={{display:'flex', gap:12, flexWrap:'wrap', alignItems:'center'}}>
              <div style={{padding:'8px 12px', border:'1px solid rgba(59,130,246,0.3)', borderRadius:8, background:'rgba(59,130,246,0.08)'}}>
                <strong>Stanje bazena:</strong> skupaj {poolStats.total} • prosto {poolStats.free} • zasedeno {poolStats.used}
              </div>
              <button className="button" onClick={refreshPool}>Osveži</button>
              <button className="button" onClick={()=>{
                let assigned = 0
                const updatedUsers = JSON.parse(localStorage.getItem('hvac_registered_users')||'[]')
                for (const u of users) {
                  if (!u.aiApiKey) {
                    const item = poolAssignNextFree(u.id)
                    if (!item) break
                    assigned++
                    updateUserApiKey(u.id, item.key)
                    const idx = updatedUsers.findIndex((x:any)=>x.id===u.id)
                    if (idx>=0) updatedUsers[idx].aiApiKey = item.key
                  }
                }
                localStorage.setItem('hvac_registered_users', JSON.stringify(updatedUsers))
                setUsers(updatedUsers)
                refreshPool()
                alert(assigned>0 ? `Dodeljenih ključev: ${assigned}` : 'Ni bilo uporabnikov brez ključa ali ni prostih ključev.')
              }}>⚡ Dodeli vsem brez ključa</button>
            </div>
            <details>
              <summary>💾 Varnostna kopija in uvoz/masovne operacije</summary>
              <div style={{display:'grid', gap:8, marginTop:8}}>
                <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                  <button className="button" onClick={()=>{
                    const data = poolExport(true)
                    const blob = new Blob([data], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'api-keys-pool.json'
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                    URL.revokeObjectURL(url)
                  }}>⬇️ Izvozi JSON</button>
                  <input ref={fileInputRef} type="file" accept="application/json" style={{display:'none'}} onChange={(e)=>{
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = ()=>{
                      const text = String(reader.result||'')
                      const res = poolImport(text, 'merge')
                      alert(`Uvoz dokončan. Dodano: ${res.added}, preskočeno: ${res.skipped}.`)
                      refreshPool()
                      e.target.value = ''
                    }
                    reader.readAsText(file)
                  }} />
                  <button className="button" onClick={()=> fileInputRef.current?.click() }>⬆️ Uvozi JSON (merge)</button>
                </div>
                <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                  <button className="button" onClick={()=>{
                    if (!confirm('Odpnem vse ključe v bazenu in odstranim iz uporabnikov?')) return
                    // počisti pri uporabnikih, če se ujemajo ključi
                    const all = poolListKeys()
                    const assigned = all.filter(k=>!!k.assignedTo)
                    const updatedUsers = JSON.parse(localStorage.getItem('hvac_registered_users')||'[]')
                    let cleared = 0
                    for (const item of assigned) {
                      const idx = updatedUsers.findIndex((x:any)=> x.id === item.assignedTo)
                      if (idx>=0 && updatedUsers[idx].aiApiKey === item.key) {
                        updatedUsers[idx].aiApiKey = ''
                        cleared++
                      }
                    }
                    localStorage.setItem('hvac_registered_users', JSON.stringify(updatedUsers))
                    setUsers(updatedUsers)
                    const count = poolUnassignAll()
                    refreshPool()
                    alert(`Odpeto ključev: ${count}. Počiščenih pri uporabnikih: ${cleared}.`)
                  }}>♻️ Odpni vse + počisti pri uporabnikih</button>
                  <button className="button" onClick={()=>{
                    if (!confirm('Izbrišem VSE proste ključe iz bazena? (zasedeni ostanejo)')) return
                    const removed = poolDeleteAllFree()
                    refreshPool()
                    alert(`Izbrisanih prostih ključev: ${removed}.`)
                  }}>🗑️ Izbriši vse proste ključe</button>
                </div>
              </div>
            </details>
            <details>
              <summary>➕ Bulk dodaj ključe v bazen</summary>
              <div style={{marginTop:8}}>
                <textarea
                  value={bulkKeysText}
                  onChange={(e)=>setBulkKeysText(e.target.value)}
                  placeholder={'Prilepi 1 ključ na vrstico\nalias ločeno z vejicami/razmaki'}
                  style={{width:'100%', minHeight:100, padding:10, background:'rgba(124,58,237,0.08)', border:'1px solid rgba(124,58,237,0.3)', borderRadius:8, color:'#e2e8f0'}}
                />
                <div style={{display:'flex', gap:8, marginTop:8}}>
                  <button className="button" onClick={()=>{
                    const parts = bulkKeysText
                      .split(/[\n,\s]+/g)
                      .map(s=>s.trim())
                      .filter(Boolean)
                    if (parts.length===0) { alert('Ni ključev za dodati.'); return }
                    const res = poolAddKeys(parts)
                    setBulkKeysText('')
                    refreshPool()
                    alert(`Dodano: ${res.added}, preskočeno (duplikati/prazni): ${res.skipped}`)
                  }}>Dodaj v bazen</button>
                  <button className="button" onClick={()=>setBulkKeysText('')}>Počisti</button>
                </div>
              </div>
            </details>
            <details>
              <summary>📋 Pregled ključev v bazenu</summary>
              <div style={{display:'grid', gap:12, marginTop:8}}>
                <div>
                  <h4 style={{margin:'6px 0'}}>Prosti ključi ({pool.filter(k=>!k.assignedTo).length})</h4>
                  {pool.filter(k=>!k.assignedTo).length===0 ? <div style={{color:'#94a3b8'}}>Ni prostih ključev.</div> : (
                    <table>
                      <thead><tr><th>Ključ</th><th>Akcije</th></tr></thead>
                      <tbody>
                        {pool.filter(k=>!k.assignedTo).map(k=> (
                          <tr key={k.key}>
                            <td><code>{k.key}</code></td>
                            <td>
                              <div style={{display:'flex', gap:8}}>
                                <button className="button" onClick={()=>{ navigator.clipboard.writeText(k.key); alert('Kopirano.') }}>📋 Kopiraj</button>
                                <button className="button" onClick={()=>{ if (confirm('Izbrišem ključ iz bazena?')) { poolDeleteKey(k.key); refreshPool() } }}>🗑️ Izbriši</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div>
                  <h4 style={{margin:'6px 0'}}>Zasedeni ključi ({pool.filter(k=>!!k.assignedTo).length})</h4>
                  {pool.filter(k=>!!k.assignedTo).length===0 ? <div style={{color:'#94a3b8'}}>Ni zasedenih ključev.</div> : (
                    <table>
                      <thead><tr><th>Ključ</th><th>Dodeljen</th><th>Čas</th><th>Akcije</th></tr></thead>
                      <tbody>
                        {pool.filter(k=>!!k.assignedTo).map(k=> {
                          const holder = users.find(u=>u.id===k.assignedTo)
                          const holderName = holder ? (`${holder.firstName||''} ${holder.lastName||''}`.trim() || holder.username) : (k.assignedTo || '—')
                          return (
                            <tr key={k.key}>
                              <td><code>{k.key}</code></td>
                              <td>{holderName}</td>
                              <td>{k.assignedAt ? new Date(k.assignedAt).toLocaleString() : '—'}</td>
                              <td>
                                <div style={{display:'flex', gap:8}}>
                                  <button className="button" onClick={()=>{ navigator.clipboard.writeText(k.key); alert('Kopirano.') }}>📋 Kopiraj</button>
                                  <button className="button" onClick={()=>{
                                    // If the holder still has that key, clear it
                                    if (holder?.aiApiKey === k.key) {
                                      updateUserApiKey(holder.id, '')
                                      const updated = JSON.parse(localStorage.getItem('hvac_registered_users')||'[]')
                                      const idx = updated.findIndex((x:any)=>x.id===holder.id)
                                      if (idx>=0) updated[idx].aiApiKey = ''
                                      localStorage.setItem('hvac_registered_users', JSON.stringify(updated))
                                      setUsers(updated)
                                    }
                                    poolUnassignKey(k.key); refreshPool()
                                  }}>♻️ Odpni</button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </details>
          </div>
          <table>
            <thead>
              <tr>
                <th>Uporabnik</th>
                <th>Email</th>
                <th>Vloga</th>
                <th>AI API Ključ</th>
                <th>Status</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u:any)=> (
                <tr key={u.id}>
                  <td>
                    <div>
                      <div style={{fontWeight:600}}>{`${u.firstName||''} ${u.lastName||''}`.trim() || u.username}</div>
                      <div style={{fontSize:'0.85em', color:'#94a3b8'}}>@{u.username}</div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span style={{
                      padding:'4px 8px',
                      borderRadius:4,
                      background: u.role==='admin' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)',
                      color: u.role==='admin' ? '#fca5a5' : '#93c5fd',
                      fontSize:'0.85em',
                      fontWeight:600
                    }}>
                      {u.role==='admin' ? '👑 Admin' : '👤 Student'}
                    </span>
                  </td>
                  <td>
                    <input 
                      key={(u.aiApiKey||'') + ':' + u.id}
                      type="text" 
                      placeholder="sk-..."
                      defaultValue={u.aiApiKey || ''}
                      onBlur={(e)=>{
                        const newKey = e.target.value.trim()
                        const oldKey = u.aiApiKey || ''
                        // If nothing changed, do nothing
                        if (newKey === oldKey) return

                        // Unassign old pool key if it exists and was assigned to this user
                        if (oldKey) {
                          const oldInPool = poolFindKey(oldKey)
                          if (oldInPool && oldInPool.assignedTo === u.id) {
                            poolUnassignKey(oldKey)
                          }
                        }

                        // Assign pool key if newKey exists in pool
                        if (newKey) {
                          const newInPool = poolFindKey(newKey)
                          if (newInPool) {
                            poolAssignKey(newKey, u.id)
                          }
                        }

                        // Persist on user
                        updateUserApiKey(u.id, newKey)
                        setUsers(JSON.parse(localStorage.getItem('hvac_registered_users')||'[]'))
                        refreshPool()
                      }}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(124,58,237,0.1)',
                        border: '1px solid rgba(124,58,237,0.3)',
                        borderRadius: 6,
                        color: '#e2e8f0',
                        fontSize: '0.9rem',
                        width: '100%',
                        maxWidth: '300px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </td>
                  <td>
                    {u.aiApiKey ? (
                      <span style={{color:'#22c55e', display:'flex', alignItems:'center', gap:6}}>
                        <span style={{fontSize:'1.3em'}}>✓</span>
                        <span style={{fontSize:'0.9em'}}>Nastavljen</span>
                      </span>
                    ) : (
                      <span style={{color:'#f59e0b', display:'flex', alignItems:'center', gap:6}}>
                        <span style={{fontSize:'1.3em'}}>⚠️</span>
                        <span style={{fontSize:'0.9em'}}>Ni nastavljen</span>
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                      <button 
                        className="button"
                        onClick={()=>{
                          if(u.aiApiKey) {
                            navigator.clipboard.writeText(u.aiApiKey)
                            alert(`API ključ za ${u.username} kopiran!`)
                          }
                        }}
                        disabled={!u.aiApiKey}
                        style={{opacity: u.aiApiKey ? 1 : 0.5}}
                      >
                        📋 Kopiraj
                      </button>
                      <button
                        className="button"
                        onClick={()=>{
                          const item = poolAssignNextFree(u.id)
                          if (!item) { alert('Ni prostih ključev v bazenu.'); return }
                          updateUserApiKey(u.id, item.key)
                          setUsers(JSON.parse(localStorage.getItem('hvac_registered_users')||'[]'))
                          refreshPool()
                        }}
                      >
                        🎲 Dodeli prvi prosti
                      </button>
                      <button
                        className="button"
                        onClick={()=>{
                          const oldKey = u.aiApiKey
                          if (oldKey) {
                            const inPool = poolFindKey(oldKey)
                            if (inPool && inPool.assignedTo === u.id) {
                              poolUnassignKey(oldKey)
                            }
                          }
                          updateUserApiKey(u.id, '')
                          setUsers(JSON.parse(localStorage.getItem('hvac_registered_users')||'[]'))
                          refreshPool()
                        }}
                      >
                        ♻️ Odstrani ključ
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{marginTop:20, padding:16, background:'rgba(59,130,246,0.1)', borderRadius:8, border:'1px solid rgba(59,130,246,0.3)'}}>
            <h4 style={{color:'#93c5fd', margin:'0 0 8px 0'}}>ℹ️ Navodila:</h4>
            <ul style={{color:'#cbd5e1', fontSize:'0.9rem', margin:0, paddingLeft:20}}>
              <li>Vpiši AI API ključ za vsakega uporabnika in pritisni Enter ali klikni stran iz polja</li>
              <li>API ključ se bo samodejno shranil in bo na voljo uporabniku za AI funkcije</li>
              <li>Uporabniki z nastavljenim ključem bodo imeli dostop do AI asistenta</li>
              <li>Lahko tudi kopiraš obstoječe ključe z gumbom "Kopiraj"</li>
              <li>Za hitro dodeljevanje uporabi gumb "Dodeli prvi prosti" — vzame naslednji prosti ključ iz bazena</li>
              <li>Pri ročnem vnosu: če vpišeš ključ, ki je v bazenu, se bo samodejno označil kot dodeljen temu uporabniku</li>
            </ul>
          </div>
        </div>
      )}


      {activeTab==='requests' && (
        <div className="card">
          <h3>Prošnje za dodatne poskuse</h3>
          {requests.length===0 ? <p>Ni odprtih prošenj.</p> : (
            <table>
              <thead><tr><th>Uporabnik</th><th>Lekcija</th><th>Datum</th><th>Stanje</th><th>Akcije</th></tr></thead>
              <tbody>
                {requests.map(r=> (
                  <tr key={r.id}>
                    <td>{r.username} ({r.userId})</td>
                    <td>{r.lessonId}</td>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td>{r.status}</td>
                    <td style={{display:'flex',gap:8}}>
                      <button className="button" onClick={()=>{ resolveRequest(r.id,'approved',{ allowedAttempts: 3 }); setRequests(listRequests()) }}>Odobri + nastavitev 3 poskuse</button>
                      <button className="button" onClick={()=>{ resolveRequest(r.id,'rejected'); setRequests(listRequests()) }}>Zavrni</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab==='attempts' && (
        <div className="card">
          <h3>Oddani poskusi</h3>
          <table>
            <thead><tr><th>User</th><th>UserId</th><th>Lekcija</th><th>Rezultat</th><th>Čas</th><th></th></tr></thead>
            <tbody>
              {attempts.map((a:any)=> (
                <tr key={a.id || a.finishedAt}>
                  <td>{a.user}</td>
                  <td>{a.userId || ''}</td>
                  <td>{a.lessonId || a.lesson}</td>
                  <td>{a.score}{typeof a.totalQuestions==='number' ? ` / ${a.totalQuestions}`: ''}</td>
                  <td>{a.finishedAt ? new Date(a.finishedAt).toLocaleString() : ''}</td>
                  <td><details><summary>Odgovori</summary><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(a.answers, null, 2)}</pre></details></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab==='users' && (
        <div className="card">
          <h3>Registrirani uporabniki</h3>
          <div style={{display:'flex', gap:8, margin:'8px 0 12px 0'}}>
            <button className="button" onClick={()=>{
              // Ustvari novega uporabnika (modal)
              setEditUser({ id: '', username:'', email:'', role:'student', firstName:'', lastName:'', company:'', purpose:'', aiApiKey:'', unlockedLessons:[] })
            }}>➕ Dodaj uporabnika</button>
            <button className="button" onClick={()=> setUsers(JSON.parse(localStorage.getItem('hvac_registered_users')||'[]')) }>Osveži</button>
          </div>
          <table>
            <thead><tr><th>Ime</th><th>Priimek</th><th>Uporabniško ime</th><th>Email</th><th>Vloga</th><th>AI API Ključ</th><th>Podjetje</th><th>Namen</th><th>Akcije</th></tr></thead>
            <tbody>
              {users.map((u:any)=> (
                <tr key={u.id}>
                  <td>{u.firstName||''}</td>
                  <td>{u.lastName||''}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <div style={{display:'flex', alignItems:'center', gap:4}}>
                      <input 
                        type="text" 
                        placeholder="sk-..."
                        defaultValue={u.aiApiKey || ''}
                        onBlur={(e)=>{
                          const newKey = e.target.value.trim()
                          if (newKey && newKey !== u.aiApiKey) {
                            updateUserApiKey(u.id, newKey)
                            setUsers(JSON.parse(localStorage.getItem('hvac_registered_users')||'[]'))
                          }
                        }}
                        style={{
                          padding: '6px 10px',
                          background: 'rgba(124,58,237,0.1)',
                          border: '1px solid rgba(124,58,237,0.3)',
                          borderRadius: 6,
                          color: '#e2e8f0',
                          fontSize: '0.85rem',
                          width: '180px',
                          fontFamily: 'monospace'
                        }}
                      />
                      {u.aiApiKey && <span style={{color:'#22c55e', fontSize:'1.2em'}}>✓</span>}
                    </div>
                  </td>
                  <td>{u.company||''}</td>
                  <td>{u.purpose||''}</td>
                  <td>
                    <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                      <button className="button" onClick={()=> setDrillUser(u)}>Zgodovina</button>
                      {u.role !== 'admin' ? (
                        <button className="button" onClick={()=>{ updateUserRole(u.id,'admin'); setUsers(JSON.parse(localStorage.getItem('hvac_registered_users')||'[]')) }}>Dodeli admin</button>
                      ) : (
                        <button className="button" disabled={currentUser?.id===u.id} onClick={()=>{ updateUserRole(u.id,'student'); setUsers(JSON.parse(localStorage.getItem('hvac_registered_users')||'[]')) }}>Odstrani admin</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
                          <button className="button" onClick={()=> setEditUser(u)}>✏️ Uredi</button>
                          <button className="button" onClick={()=>{
                            if (!confirm(`Izbrišem uporabnika ${u.username}?`)) return
                            const arr = JSON.parse(localStorage.getItem('hvac_registered_users')||'[]')
                            const next = arr.filter((x:any)=> x.id !== u.id)
                            localStorage.setItem('hvac_registered_users', JSON.stringify(next))
                            setUsers(next)
                            // počisti poskuse tega uporabnika
                            try {
                              const attempts = JSON.parse(localStorage.getItem('mock_attempts')||'[]')
                              const rest = attempts.filter((a:any)=> (a.userId!==u.id) && (a.user!==u.username))
                              localStorage.setItem('mock_attempts', JSON.stringify(rest))
                            } catch {}
                            // če brišemo prijavljenega, ga odjavimo
                            if (currentUser?.id === u.id) {
                              alert('Izbrisal si svoj račun. Seja bo prekinjena.')
                              localStorage.removeItem('hvac_auth_token'); localStorage.removeItem('hvac_user'); window.location.href='/login'
                            }
                          }}>🗑️ Izbriši</button>
                          <button className="button" onClick={()=>{
                            if (!confirm(`Ponastavim račun ${u.username}? To bo odstranilo AI ključ, odklenjene lekcije in poskuse.`)) return
                            const arr = JSON.parse(localStorage.getItem('hvac_registered_users')||'[]')
                            const idx = arr.findIndex((x:any)=> x.id === u.id)
                            if (idx>=0) {
                              arr[idx] = { ...arr[idx], aiApiKey:'', unlockedLessons:[] }
                              localStorage.setItem('hvac_registered_users', JSON.stringify(arr))
                              setUsers(arr)
                            }
                            try {
                              const attempts = JSON.parse(localStorage.getItem('mock_attempts')||'[]')
                              const rest = attempts.filter((a:any)=> (a.userId!==u.id) && (a.user!==u.username))
                              localStorage.setItem('mock_attempts', JSON.stringify(rest))
                            } catch {}
                            alert('Račun ponastavljen.')
                          }}>🔄 Ponastavi račun</button>
          </table>
          {drillUser && (
            <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1300, display:'flex', alignItems:'center', justifyContent:'center'}} onClick={()=>setDrillUser(null)}>
              <div onClick={(e)=>e.stopPropagation()} style={{background:'#0b1220', border:'1px solid rgba(124,58,237,0.4)', borderRadius:12, width:'min(900px, 95vw)', maxHeight:'90vh', overflow:'auto'}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid rgba(124,58,237,0.3)'}}>
                  <div>

              {editUser && (
                <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1400, display:'flex', alignItems:'center', justifyContent:'center'}} onClick={()=>setEditUser(null)}>
                  <div onClick={(e)=>e.stopPropagation()} style={{background:'#0b1220', border:'1px solid rgba(124,58,237,0.4)', borderRadius:12, width:'min(700px, 95vw)'}}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid rgba(124,58,237,0.3)'}}>
                      <div style={{fontWeight:700}}>Uredi uporabnika</div>
                      <button className="button" onClick={()=>setEditUser(null)}>Zapri</button>
                    </div>
                    <div style={{padding:16, display:'grid', gap:10}}>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                        <label style={{display:'grid', gap:6}}>
                          <span>Ime</span>
                          <input value={editUser.firstName||''} onChange={(e)=> setEditUser({...editUser, firstName: e.target.value})} />
                        </label>
                        <label style={{display:'grid', gap:6}}>
                          <span>Priimek</span>
                          <input value={editUser.lastName||''} onChange={(e)=> setEditUser({...editUser, lastName: e.target.value})} />
                        </label>
                        <label style={{display:'grid', gap:6}}>
                          <span>Uporabniško ime</span>
                          <input value={editUser.username||''} onChange={(e)=> setEditUser({...editUser, username: e.target.value})} />
                        </label>
                        <label style={{display:'grid', gap:6}}>
                          <span>Email</span>
                          <input value={editUser.email||''} onChange={(e)=> setEditUser({...editUser, email: e.target.value})} />
                        </label>
                        <label style={{display:'grid', gap:6}}>
                          <span>Podjetje</span>
                          <input value={editUser.company||''} onChange={(e)=> setEditUser({...editUser, company: e.target.value})} />
                        </label>
                        <label style={{display:'grid', gap:6}}>
                          <span>Namen</span>
                          <input value={editUser.purpose||''} onChange={(e)=> setEditUser({...editUser, purpose: e.target.value})} />
                        </label>
                        <label style={{display:'grid', gap:6}}>
                          <span>Vloga</span>
                          <select value={editUser.role||'student'} onChange={(e)=> setEditUser({...editUser, role: e.target.value})}>
                            <option value="student">student</option>
                            <option value="admin">admin</option>
                          </select>
                        </label>
                      </div>
                      <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:6}}>
                        <button className="button" onClick={()=>{
                          // Shrani spremembe
                          const arr = JSON.parse(localStorage.getItem('hvac_registered_users')||'[]')
                          // Dodaj novega ali posodobi obstoječega
                          if (!editUser.id) {
                            editUser.id = Math.random().toString(36).substr(2,9)
                            arr.push(editUser)
                          } else {
                            const idx = arr.findIndex((x:any)=> x.id === editUser.id)
                            if (idx>=0) arr[idx] = { ...arr[idx], ...editUser }
                          }
                          localStorage.setItem('hvac_registered_users', JSON.stringify(arr))
                          setUsers(arr)
                          // če urejamo trenutnega uporabnika, osveži sejo
                          if (currentUser?.id === editUser.id) {
                            localStorage.setItem('hvac_user', JSON.stringify(editUser))
                          }
                          setEditUser(null)
                        }}>💾 Shrani</button>
                        <button className="button" onClick={()=> setEditUser(null)}>Prekliči</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
                    <div style={{fontSize:18, fontWeight:700}}>
                      {`${drillUser.firstName||''} ${drillUser.lastName||''}`.trim() || drillUser.username}
                    </div>
                    <div style={{fontSize:12, color:'#94a3b8'}}>ID: {drillUser.id} • {drillUser.email}</div>
                  </div>
                  <button className="button" onClick={()=>setDrillUser(null)}>Zapri</button>
                </div>
                <div style={{padding:16}}>
                  {(()=>{
                    const items = attempts
                      .filter((a:any)=> (a.userId===drillUser.id) || (a.user===drillUser.username))
                      .sort((a:any,b:any)=> (b.finishedAt||b.id||0) - (a.finishedAt||a.id||0))
                    if (items.length===0) return <p style={{color:'#94a3b8'}}>Ni poskusov za tega uporabnika.</p>
                    return (
                      <div style={{display:'grid', gap:12}}>
                        {items.map((a:any)=>{
                          const lid = Number(a.lessonId ?? a.lesson)
                          const title = lessonTitleById[lid] || `Lekcija ${lid}`
                          const total = a.totalQuestions ?? (Array.isArray(a.answers)? a.answers.length : undefined)
                          const score = Number(a.score)||0
                          const pct = total ? Math.round((score/total)*100) : null
                          const review = Array.isArray(a.review) ? a.review : []
                          const wrongs = review.filter((r:any)=> r && r.isCorrect===false)
                          return (
                            <div key={a.id||a.finishedAt} style={{border:'1px solid rgba(124,58,237,0.3)', borderRadius:8, padding:12}}>
                              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                                <div>
                                  <div style={{fontWeight:700}}>{title} <span style={{fontWeight:400, color:'#94a3b8'}}>#{lid||''}</span></div>
                                  <div style={{fontSize:12, color:'#94a3b8'}}>{a.finishedAt ? new Date(a.finishedAt).toLocaleString() : ''}</div>
                                </div>
                                <div style={{fontWeight:700}}>
                                  {score}{typeof total==='number' ? ` / ${total}` : ''} {pct!=null ? <span style={{color: pct>=55 ? '#22c55e' : '#ef4444'}}>({pct}%)</span> : null}
                                </div>
                              </div>
                              {a.comment && (
                                <div style={{marginTop:8, padding:10, background:'rgba(148,163,184,0.08)', border:'1px solid rgba(148,163,184,0.2)', borderRadius:6}}>
                                  <div style={{fontSize:12, color:'#94a3b8', marginBottom:4}}>Komentar študenta</div>
                                  <div style={{whiteSpace:'pre-wrap'}}>{a.comment}</div>
                                </div>
                              )}
                              <details style={{marginTop:8}}>
                                <summary>Podrobnosti odgovorov</summary>
                                {review.length===0 ? (
                                  <div style={{color:'#94a3b8', paddingTop:6}}>Podrobnosti niso na voljo.</div>
                                ) : wrongs.length===0 ? (
                                  <div style={{color:'#22c55e', paddingTop:6}}>Vsi odgovori pravilni.</div>
                                ) : (
                                  <div style={{display:'grid', gap:8, paddingTop:8}}>
                                    {wrongs.map((r:any)=> (
                                      <div key={r.index} style={{border:'1px solid rgba(239,68,68,0.3)', borderRadius:6, padding:10, background:'rgba(239,68,68,0.06)'}}>
                                        <div style={{fontWeight:700, marginBottom:4}}>Vprašanje {Number(r.index)+1}:</div>
                                        <div style={{marginBottom:6}}>{r.question}</div>
                                        <div style={{display:'grid', gap:4, fontSize:14}}>
                                          <div><span style={{color:'#94a3b8'}}>Izbran odgovor:</span> {r.selectedText ?? '—'} {typeof r.selectedIndex==='number' ? `(#{${r.selectedIndex}})` : ''}</div>
                                          <div><span style={{color:'#94a3b8'}}>Pravilni odgovor:</span> {r.correctText} {typeof r.correctIndex==='number' ? `(#{${r.correctIndex}})` : ''}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </details>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab==='lessons' && (
        <div className="card">
          <h3>📚 Upravljanje dostopa do lekcij</h3>
          <p style={{color:'#94a3b8', marginBottom:20}}>
            Odkleni lekcije za posamezne uporabnike. Privzeto so vse lekcije zaklenjene.
          </p>
          <table>
            <thead>
              <tr>
                <th>Uporabnik</th>
                <th>Email</th>
                <th>Odklenjene lekcije</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {users.filter((u:any)=>u.role!=='admin').map((u:any)=> (
                <tr key={u.id}>
                  <td>
                    <div>
                      <div style={{fontWeight:600}}>{`${u.firstName||''} ${u.lastName||''}`.trim() || u.username}</div>
                      <div style={{fontSize:'0.85em', color:'#94a3b8'}}>@{u.username}</div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span style={{
                      padding:'4px 12px',
                      borderRadius:6,
                      background: (u.unlockedLessons?.length||0) > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                      color: (u.unlockedLessons?.length||0) > 0 ? '#22c55e' : '#ef4444',
                      fontSize:'0.9em',
                      fontWeight:600
                    }}>
                      {u.unlockedLessons?.length || 0} / {lessons.length}
                    </span>
                  </td>
                  <td>
                    <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                      <button 
                        className="button"
                        onClick={()=>setManageLessonsUser(u)}
                      >
                        🔓 Upravljaj dostop
                      </button>
                      <button
                        className="button"
                        onClick={()=>{
                          const allLessonIds = lessons.map(l=>l.id)
                          updateUserLessons(u.id, allLessonIds)
                          setUsers(JSON.parse(localStorage.getItem('hvac_registered_users')||'[]'))
                        }}
                      >
                        ✅ Odkleni vse
                      </button>
                      <button
                        className="button"
                        onClick={()=>{
                          updateUserLessons(u.id, [])
                          setUsers(JSON.parse(localStorage.getItem('hvac_registered_users')||'[]'))
                        }}
                      >
                        🔒 Zakleni vse
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {manageLessonsUser && (
            <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1300, display:'flex', alignItems:'center', justifyContent:'center', padding:20}} onClick={()=>setManageLessonsUser(null)}>
              <div onClick={(e)=>e.stopPropagation()} style={{background:'#0b1220', border:'1px solid rgba(124,58,237,0.4)', borderRadius:12, width:'min(900px, 95vw)', maxHeight:'90vh', overflow:'auto'}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid rgba(124,58,237,0.3)', position:'sticky', top:0, background:'#0b1220', zIndex:1}}>
                  <div>
                    <div style={{fontSize:18, fontWeight:700}}>
                      Upravljanje lekcij za {`${manageLessonsUser.firstName||''} ${manageLessonsUser.lastName||''}`.trim() || manageLessonsUser.username}
                    </div>
                    <div style={{fontSize:12, color:'#94a3b8'}}>Izberi lekcije, do katerih naj ima uporabnik dostop</div>
                  </div>
                  <button className="button" onClick={()=>setManageLessonsUser(null)}>Zapri</button>
                </div>
                <div style={{padding:20}}>
                  <div style={{display:'grid', gap:8}}>
                    {lessons.map((lesson:any)=>{
                      const isUnlocked = manageLessonsUser.unlockedLessons?.includes(lesson.id) ?? false
                      return (
                        <div 
                          key={lesson.id} 
                          style={{
                            display:'flex', 
                            alignItems:'center', 
                            justifyContent:'space-between',
                            padding:12,
                            border:'1px solid rgba(124,58,237,0.3)',
                            borderRadius:8,
                            background: isUnlocked ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'
                          }}
                        >
                          <div style={{display:'flex', alignItems:'center', gap:12}}>
                            <div style={{fontSize:'1.5em'}}>{isUnlocked ? '🔓' : '🔒'}</div>
                            <div>
                              <div style={{fontWeight:600}}>{lesson.title}</div>
                              <div style={{fontSize:'0.85em', color:'#94a3b8'}}>ID: {lesson.id} • {lesson.annexReference}</div>
                            </div>
                          </div>
                          <button
                            className="button"
                            onClick={()=>{
                              const current = manageLessonsUser.unlockedLessons || []
                              const updated = isUnlocked 
                                ? current.filter((id:number)=>id!==lesson.id)
                                : [...current, lesson.id]
                              updateUserLessons(manageLessonsUser.id, updated)
                              setManageLessonsUser({...manageLessonsUser, unlockedLessons: updated})
                              setUsers(JSON.parse(localStorage.getItem('hvac_registered_users')||'[]'))
                            }}
                          >
                            {isUnlocked ? '🔒 Zakleni' : '🔓 Odkleni'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab==='certs' && (
        <div className="card">
          <h3>Certifikati</h3>
          <div style={{display:'grid',gap:12}}>
            {users.map((u:any)=>{
              const eligible = canIssueCert(u.id)
              const fullName = `${u.firstName||''} ${u.lastName||''}`.trim()
              return (
                <div key={u.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',border:'1px solid rgba(124,58,237,0.3)',borderRadius:8,padding:12}}>
                  <div>
                    <div style={{fontWeight:700}}>{fullName || u.username}</div>
                    <div style={{fontSize:12,color:'#94a3b8'}}>Status: {eligible ? '✅ izpolnjeno' : '⌛ še v teku'}</div>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button className="button" disabled={!eligible} onClick={()=>{ const c = addCertificate({ userId: u.id, fullName: fullName || u.username }); setCerts(listCertificates()); alert(`Certifikat izdan: ${c.code}`) }}>Izdaj certifikat</button>
                  </div>
                </div>
              )
            })}
          </div>

          <h4 style={{marginTop:20}}>Že izdani certifikati</h4>
          {certs.length===0 ? <p>Ni izdanih certifikatov.</p> : (
            <table>
              <thead><tr><th>Koda</th><th>Uporabnik</th><th>Datum</th><th></th></tr></thead>
              <tbody>
                {certs.map(c=> (
                  <tr key={c.id}>
                    <td>{c.code}</td>
                    <td>{c.fullName}</td>
                    <td>{new Date(c.issuedAt).toLocaleString()}</td>
                    <td><button className="button" onClick={()=>setPreviewCert({ fullName: c.fullName, code: c.code })}>Pogled</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {previewCert && (
            <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center'}} onClick={()=>setPreviewCert(null)}>
              <div onClick={(e)=>e.stopPropagation()} style={{background:'#0b1220', padding:20, borderRadius:12}}>
                <Certificate fullName={previewCert.fullName} code={previewCert.code} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
