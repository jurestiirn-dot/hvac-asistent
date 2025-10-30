import React from 'react'
import { useNavigate } from 'react-router-dom'
import cms from '../services/cms'
import { motion } from 'framer-motion'

export default function Login() {
  const [user, setUser] = React.useState('')
  const [pass, setPass] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const nav = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await cms.login(user, pass)
      // store token (mock or real)
      localStorage.setItem('jwt', res.jwt)
      localStorage.setItem('user', JSON.stringify(res.user || { username: user }))
      nav('/lessons')
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    }
  }

  return (
    <div className="login-wrap">
      <motion.div className="login-card tilt enter" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <div className="login-inner card">
          <div className="brand">
            <div className="logo">HV</div>
            <div>
              <h2>HVAC Asistent</h2>
              <div style={{fontSize:12,color:'var(--muted)'}}>Prijava v sistem</div>
            </div>
          </div>

          <form onSubmit={submit}>
            <div className="form-row">
              <label>Uporabniško ime</label>
              <input value={user} onChange={e => setUser(e.target.value)} placeholder="janez" />
            </div>
            <div className="form-row">
              <label>Geslo</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" />
            </div>

            <div className="form-actions">
              <button className="btn-primary" type="submit">Prijavi se</button>
              <button type="button" className="btn-ghost" onClick={()=>{setUser('demo'); setPass('demo')}}>Demo</button>
            </div>
            {error && <p style={{color:'#ffb4b4',marginTop:10}}>{error}</p>}
          </form>
        </div>
      </motion.div>
    </div>
  )
}
