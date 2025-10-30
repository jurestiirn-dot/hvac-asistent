import React from 'react'
import { useQuizConfig } from '../contexts/QuizConfigContext'
import { motion } from 'framer-motion'

export default function QuizConfigAdmin() {
  const { currentEvent, config, updateEventConfig } = useQuizConfig()
  const eventCfg = config[currentEvent]
  const [lessonId, setLessonId] = React.useState<string>('')
  const [hintLimit, setHintLimit] = React.useState<string>('')
  const [fiftyLimit, setFiftyLimit] = React.useState<string>('')

  if (!eventCfg) return null

  const handleSetGlobalHints = (val: number) => {
    updateEventConfig(currentEvent, { maxHints: val })
  }

  const handleSetGlobalFifty = (val: number) => {
    updateEventConfig(currentEvent, { maxFiftyFifty: val })
  }

  const handleSetLessonHint = () => {
    const id = parseInt(lessonId)
    const limit = parseInt(hintLimit)
    if (isNaN(id) || isNaN(limit)) return
    
    const updated = { ...eventCfg.lessonHintLimits, [id]: limit }
    updateEventConfig(currentEvent, { lessonHintLimits: updated })
    setLessonId('')
    setHintLimit('')
  }

  const handleSetLessonFifty = () => {
    const id = parseInt(lessonId)
    const limit = parseInt(fiftyLimit)
    if (isNaN(id) || isNaN(limit)) return
    
    const updated = { ...eventCfg.lessonFiftyFiftyLimits, [id]: limit }
    updateEventConfig(currentEvent, { lessonFiftyFiftyLimits: updated })
    setLessonId('')
    setFiftyLimit('')
  }

  const removeLessonHint = (id: number) => {
    const updated = { ...eventCfg.lessonHintLimits }
    delete updated[id]
    updateEventConfig(currentEvent, { lessonHintLimits: updated })
  }

  const removeLessonFifty = (id: number) => {
    const updated = { ...eventCfg.lessonFiftyFiftyLimits }
    delete updated[id]
    updateEventConfig(currentEvent, { lessonFiftyFiftyLimits: updated })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        maxWidth: 800,
        margin: '40px auto',
        padding: 30,
        background: 'linear-gradient(135deg, rgba(30,27,75,0.95), rgba(49,46,129,0.95))',
        borderRadius: 16,
        border: '1px solid rgba(124,58,237,0.3)',
      }}
    >
      <h2 style={{ 
        color: '#a78bfa', 
        marginBottom: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <span style={{ fontSize: '1.5em' }}>⚙️</span>
        Nastavitve Kviza - Admin
      </h2>

      {/* Global Settings */}
      <section style={{ marginBottom: 30 }}>
        <h3 style={{ color: '#c7d2fe', fontSize: '1.1rem', marginBottom: 16 }}>
          Globalne Nastavitve
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16,
            padding: 16,
            background: 'rgba(124,58,237,0.1)',
            borderRadius: 8
          }}>
            <label style={{ color: '#e2e8f0', flex: 1 }}>
              💡 Privzeto število namigov:
            </label>
            <input
              type="number"
              value={eventCfg.maxHints}
              onChange={(e) => handleSetGlobalHints(parseInt(e.target.value) || -1)}
              style={{
                width: 80,
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(124,58,237,0.4)',
                borderRadius: 6,
                color: '#fff',
                fontSize: '1rem'
              }}
              placeholder="-1"
            />
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              (-1 = neomejeno)
            </span>
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16,
            padding: 16,
            background: 'rgba(124,58,237,0.1)',
            borderRadius: 8
          }}>
            <label style={{ color: '#e2e8f0', flex: 1 }}>
              🌓 Privzeto število 50/50:
            </label>
            <input
              type="number"
              value={eventCfg.maxFiftyFifty}
              onChange={(e) => handleSetGlobalFifty(parseInt(e.target.value) || -1)}
              style={{
                width: 80,
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(124,58,237,0.4)',
                borderRadius: 6,
                color: '#fff',
                fontSize: '1rem'
              }}
              placeholder="-1"
            />
            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              (-1 = neomejeno)
            </span>
          </div>
        </div>
      </section>

      {/* Per-Lesson Settings */}
      <section style={{ marginBottom: 30 }}>
        <h3 style={{ color: '#c7d2fe', fontSize: '1.1rem', marginBottom: 16 }}>
          Nastavitve po Lekcijah
        </h3>

        <div style={{ 
          display: 'flex', 
          gap: 12, 
          marginBottom: 20,
          padding: 16,
          background: 'rgba(59,130,246,0.1)',
          borderRadius: 8
        }}>
          <input
            type="number"
            placeholder="ID lekcije (npr. 101)"
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(59,130,246,0.4)',
              borderRadius: 6,
              color: '#fff',
              fontSize: '1rem'
            }}
          />
          <input
            type="number"
            placeholder="Št. namigov"
            value={hintLimit}
            onChange={(e) => setHintLimit(e.target.value)}
            style={{
              width: 120,
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(59,130,246,0.4)',
              borderRadius: 6,
              color: '#fff',
              fontSize: '1rem'
            }}
          />
          <button
            onClick={handleSetLessonHint}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.95rem'
            }}
          >
            💡 Nastavi
          </button>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: 12, 
          marginBottom: 20,
          padding: 16,
          background: 'rgba(245,158,11,0.1)',
          borderRadius: 8
        }}>
          <input
            type="number"
            placeholder="ID lekcije (npr. 101)"
            value={lessonId}
            onChange={(e) => setLessonId(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(245,158,11,0.4)',
              borderRadius: 6,
              color: '#fff',
              fontSize: '1rem'
            }}
          />
          <input
            type="number"
            placeholder="Št. 50/50"
            value={fiftyLimit}
            onChange={(e) => setFiftyLimit(e.target.value)}
            style={{
              width: 120,
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(245,158,11,0.4)',
              borderRadius: 6,
              color: '#fff',
              fontSize: '1rem'
            }}
          />
          <button
            onClick={handleSetLessonFifty}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.95rem'
            }}
          >
            🌓 Nastavi
          </button>
        </div>
      </section>

      {/* Current Overrides */}
      <section>
        <h3 style={{ color: '#c7d2fe', fontSize: '1.1rem', marginBottom: 16 }}>
          Trenutne Izjeme
        </h3>

        {Object.keys(eventCfg.lessonHintLimits || {}).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: '#93c5fd', fontSize: '0.95rem', marginBottom: 8 }}>💡 Namigi:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(eventCfg.lessonHintLimits || {}).map(([id, limit]) => (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    background: 'rgba(59,130,246,0.2)',
                    borderRadius: 6,
                    border: '1px solid rgba(59,130,246,0.3)'
                  }}
                >
                  <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                    Lekcija {id}: {limit === -1 ? '∞' : limit}
                  </span>
                  <button
                    onClick={() => removeLessonHint(parseInt(id))}
                    style={{
                      background: 'rgba(239,68,68,0.3)',
                      border: 'none',
                      borderRadius: 4,
                      color: '#fca5a5',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(eventCfg.lessonFiftyFiftyLimits || {}).length > 0 && (
          <div>
            <h4 style={{ color: '#fcd34d', fontSize: '0.95rem', marginBottom: 8 }}>🌓 50/50:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(eventCfg.lessonFiftyFiftyLimits || {}).map(([id, limit]) => (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 12px',
                    background: 'rgba(245,158,11,0.2)',
                    borderRadius: 6,
                    border: '1px solid rgba(245,158,11,0.3)'
                  }}
                >
                  <span style={{ color: '#e2e8f0', fontSize: '0.9rem' }}>
                    Lekcija {id}: {limit === -1 ? '∞' : limit}
                  </span>
                  <button
                    onClick={() => removeLessonFifty(parseInt(id))}
                    style={{
                      background: 'rgba(239,68,68,0.3)',
                      border: 'none',
                      borderRadius: 4,
                      color: '#fca5a5',
                      padding: '2px 6px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(eventCfg.lessonHintLimits || {}).length === 0 && 
         Object.keys(eventCfg.lessonFiftyFiftyLimits || {}).length === 0 && (
          <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>
            Še ni nastavljena nobena izjema. Vse lekcije uporabljajo globalne nastavitve.
          </p>
        )}
      </section>
    </motion.div>
  )
}
