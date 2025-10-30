import React, { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // TODO: Send to analytics/monitoring service (Sentry, LogRocket, etc.)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/lessons'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'linear-gradient(135deg, #1e293b, #0f172a)'
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              maxWidth: '500px',
              width: '100%',
              padding: '40px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              textAlign: 'center',
              backdropFilter: 'blur(10px)'
            }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 3 }}
              style={{ fontSize: '64px', marginBottom: '20px' }}
            >
              ⚠️
            </motion.div>
            
            <h2 style={{ 
              color: '#ef4444', 
              marginBottom: '16px',
              fontSize: '24px',
              fontWeight: 700
            }}>
              Nekaj je šlo narobe
            </h2>
            
            <p style={{ 
              color: '#94a3b8', 
              marginBottom: '24px',
              fontSize: '15px',
              lineHeight: 1.6
            }}>
              {this.state.error?.message || 'Aplikacija je naletela na nepričakovano napako.'}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.button
                onClick={this.handleReset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px',
                  boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)'
                }}
              >
                🏠 Nazaj na Lekcije
              </motion.button>

              <motion.button
                onClick={() => window.location.reload()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔄 Osveži Stran
              </motion.button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details style={{
                marginTop: '24px',
                textAlign: 'left',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#cbd5e1'
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px', fontWeight: 600 }}>
                  Stack Trace (Development)
                </summary>
<pre style={{ 
                  overflow: 'auto', 
                  fontSize: '11px',
                  lineHeight: 1.4,
                  margin: 0
                }}>
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}
