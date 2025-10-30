import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Redirect to lessons if already authenticated or after successful login
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/lessons', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('Prosim, izpolnite vsa polja.')
      showToast('Prosim, izpolnite vsa polja.', 'warning')
      return
    }

    setIsLoading(true)
    try {
      await login(username, password)
      showToast('Uspešna prijava! 🎉', 'success')
      // Navigation handled by useEffect above
    } catch (err: any) {
      const errorMsg = err.message || 'Prijava ni uspela.'
      setError(errorMsg)
      showToast(errorMsg, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <motion.div
            className="auth-icon"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🔐
          </motion.div>
          <h2>Prijava</h2>
          <p className="auth-subtitle">Dostop do učnega gradiva HVAC asistenta</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <motion.div
              className="auth-error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              ⚠️ {error}
            </motion.div>
          )}

          <div className="form-group">
            <label htmlFor="username">Uporabniško ime</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Vnesite uporabniško ime"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Geslo</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Vnesite geslo"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <motion.button
            type="submit"
            className="auth-button"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Prijavljanje...
              </>
            ) : (
              '🚀 Prijavi se'
            )}
          </motion.button>

          <div className="auth-footer">
            <p>
              Še nimate računa?{' '}
              <Link to="/register" className="auth-link">
                Registrirajte se
              </Link>
            </p>
          </div>
        </form>
      </motion.div>

      {/* Background decoration */}
      <div className="auth-background">
        <div className="auth-gradient auth-gradient-1"></div>
        <div className="auth-gradient auth-gradient-2"></div>
        <div className="auth-gradient auth-gradient-3"></div>
      </div>
    </div>
  )
}
