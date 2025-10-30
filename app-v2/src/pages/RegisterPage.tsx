import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isAuthenticated } = useAuth()
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [purpose, setPurpose] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Automatic redirect when authentication state changes
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/lessons', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!username.trim() || !firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Prosim, izpolnite vsa polja.')
      return
    }

    if (username.length < 3) {
      setError('Uporabniško ime mora imeti vsaj 3 znake.')
      return
    }

    if (!validateEmail(email)) {
      setError('Prosim, vnesite veljaven email naslov.')
      return
    }

    if (password.length < 6) {
      setError('Geslo mora imeti vsaj 6 znakov.')
      return
    }

    if (password !== confirmPassword) {
      setError('Gesli se ne ujemata.')
      return
    }

    setIsLoading(true)
    try {
      await register({ username, email, password, firstName, lastName, company: company || undefined, purpose: purpose || undefined })
  // Navigation handled by useEffect above
    } catch (err: any) {
      setError(err.message || 'Registracija ni uspela.')
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
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ✨
          </motion.div>
          <h2>Registracija</h2>
          <p className="auth-subtitle">Ustvarite nov račun za dostop do gradiva</p>
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
              placeholder="Izberite uporabniško ime"
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label htmlFor="firstName">Ime</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Vaše ime"
                disabled={isLoading}
                autoComplete="given-name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Priimek</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Vaš priimek"
                disabled={isLoading}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label htmlFor="company">Podjetje (neobvezno)</label>
              <input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Ime podjetja"
                disabled={isLoading}
                autoComplete="organization"
              />
            </div>
            <div className="form-group">
              <label htmlFor="purpose">Namen udeležitve (neobvezno)</label>
              <input
                id="purpose"
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Zakaj se udeležujete"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vas.email@example.com"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Geslo</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Najmanj 6 znakov"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Potrdite geslo</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ponovno vnesite geslo"
              disabled={isLoading}
              autoComplete="new-password"
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
                Registracija...
              </>
            ) : (
              '🎓 Registriraj se'
            )}
          </motion.button>

          <div className="auth-footer">
            <p>
              Že imate račun?{' '}
              <Link to="/login" className="auth-link">
                Prijavite se
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
