import React from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import cms, { Lesson } from '../services/cms'
import Quiz from '../components/Quiz'
import { LessonVisualization } from '../components/LessonVisualizations'
import { useLanguage } from '../contexts/LanguageContext'
import { useQuizConfig } from '../contexts/QuizConfigContext'
import RealWorldCaseStudy from '../components/RealWorldCaseStudy'
import { useAuth } from '../context/AuthContext'
import { getAllowedAttempts, addRequest } from '../services/admin'

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default function LessonPage() {
  const { slug } = useParams()
  const [lesson, setLesson] = React.useState<Lesson | null>(null)
  const [showQuiz, setShowQuiz] = React.useState(false)
  const [showVisualizations, setShowVisualizations] = React.useState(false)
  const { language } = useLanguage()
  const { currentEvent, config } = useQuizConfig()
  const eventCfg = config[currentEvent]
  const [finalQuestions, setFinalQuestions] = React.useState<any[] | null>(null)
  const { user, isLessonUnlocked } = useAuth()
  const [showAttemptLimit, setShowAttemptLimit] = React.useState(false)
  const [requestSent, setRequestSent] = React.useState(false)
  const [hoveredCard, setHoveredCard] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (!slug) return
    cms.fetchLessonBySlug(slug, language).then(l => {
      // Check if lesson is unlocked before setting it
      if (l && !isLessonUnlocked(l.id)) {
        // Redirect or show locked message
        return
      }
      setLesson(l)
    })
  }, [slug, language, isLessonUnlocked])

  // Listen for hotspot anchor scroll events from ThematicDiagram
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { anchor?: string }
      const targetAnchor = detail?.anchor
      if (!targetAnchor) return
      // Close visualizations modal first (if open)
      setShowVisualizations(false)
      // Allow modal close animation to finish, then scroll
      setTimeout(() => {
        const id = slugify(targetAnchor)
        const el = document.getElementById(id) || document.querySelector(`[data-anchor="${CSS.escape(targetAnchor)}"]`) as HTMLElement | null
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          // Optional highlight
          el.animate?.([
            { boxShadow: '0 0 0px rgba(124,58,237,0)' },
            { boxShadow: '0 0 0px rgba(124,58,237,0.6)' },
            { boxShadow: '0 0 0px rgba(124,58,237,0)' }
          ], { duration: 1200 })
        }
      }, 250)
    }
    window.addEventListener('scroll-to-anchor', handler as EventListener)
    return () => window.removeEventListener('scroll-to-anchor', handler as EventListener)
  }, [])

  // Build finalQuestions applying per-lesson overrides (e.g., 25 for lesson 109)
  React.useEffect(() => {
    async function build() {
      if (!lesson) { setFinalQuestions(null); return }
      const desired = eventCfg?.questionOverrides?.[lesson.id]
      const base = (lesson.quizQuestions as any[]) || []
      if (!desired || base.length >= desired) {
        setFinalQuestions(desired ? base.slice(0, desired) : base)
        return
      }
      // Need to augment with more questions from other lessons to reach desired count
      const allLessons = await cms.fetchLessons(language)
      const pool: any[] = []
      allLessons.forEach(ls => {
        if (ls.id !== lesson.id && Array.isArray(ls.quizQuestions)) {
          pool.push(...(ls.quizQuestions as any[]))
        }
      })
      // Shuffle pool
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[pool[i], pool[j]] = [pool[j], pool[i]]
      }
      const need = desired - base.length
      const extras = pool.slice(0, Math.max(0, need))
      setFinalQuestions([...base, ...extras])
    }
    build()
  }, [lesson, language, currentEvent])

  if (!lesson) return <div>Loading...</div>

  // Check if lesson is locked
  if (!isLessonUnlocked(lesson.id)) {
    return (
      <div className="page" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        textAlign: 'center',
        padding: 40
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(124,58,237,0.1))',
            border: '2px solid rgba(239,68,68,0.3)',
            borderRadius: 20,
            padding: 60,
            maxWidth: 600
          }}
        >
          <div style={{ fontSize: '5em', marginBottom: 20 }}>🔒</div>
          <h2 style={{ fontSize: '2em', marginBottom: 16, color: '#ef4444' }}>
            Lekcija je zaklenjena
          </h2>
          <p style={{ fontSize: '1.1em', color: '#94a3b8', marginBottom: 30, lineHeight: 1.6 }}>
            Ta lekcija trenutno ni na voljo za vas.<br/>
            Za dostop kontaktirajte administratorja.
          </p>
          <div style={{
            padding: 20,
            background: 'rgba(124,58,237,0.1)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 12,
            marginTop: 20
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>📚 Lekcija:</div>
            <div style={{ fontSize: '1.2em', color: '#a78bfa' }}>{lesson.title}</div>
          </div>
        </motion.div>
      </div>
    )
  }

  // Enhanced visual rendering for practical challenges
  const renderChallenges = (content: string) => {
    const lines = content.split('\n').filter(l => l.trim())
    const challenges: { title?: string; items: string[] }[] = []
    let currentGroup: { title?: string; items: string[] } = { items: [] }
    
    lines.forEach(line => {
      if (line.startsWith('**') && line.endsWith('**')) {
        if (currentGroup.items.length > 0 || currentGroup.title) {
          challenges.push(currentGroup)
        }
        currentGroup = { title: line.slice(2, -2), items: [] }
      } else if (line.trim().match(/^[\d\-•→✓]/)) {
        const cleaned = line.replace(/^[\d\.•\-→✓]\s*/, '').trim()
        if (cleaned) currentGroup.items.push(cleaned)
      } else if (line.trim()) {
        currentGroup.items.push(line.trim())
      }
    })
    if (currentGroup.items.length > 0 || currentGroup.title) {
      challenges.push(currentGroup)
    }

    const challengeIcons = ['🚧', '⚙️', '🔥', '⛔', '🎲', '📉', '⏰', '🔧']
    const difficultyLevels = ['Visoka', 'Srednja', 'Nizka', 'Kritična']
    const priorityLevels = ['Urgentno', 'Pomembno', 'Prednost', 'Redno']

    return (
      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {challenges.map((challenge, idx) => {
          const icon = challengeIcons[idx % challengeIcons.length]
          const difficulty = difficultyLevels[idx % difficultyLevels.length]
          const priority = priorityLevels[idx % priorityLevels.length]
          const difficultyColor = 
            difficulty === 'Visoka' || difficulty === 'Kritična' ? '#ef4444' :
            difficulty === 'Srednja' ? '#f97316' : '#eab308'
          
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              onHoverStart={() => setHoveredCard(idx)}
              onHoverEnd={() => setHoveredCard(null)}
              style={{
                position: 'relative',
                background: hoveredCard === idx 
                  ? 'linear-gradient(145deg, rgba(239,68,68,0.12), rgba(2,6,23,0.9))' 
                  : 'linear-gradient(145deg, rgba(239,68,68,0.08), rgba(2,6,23,0.85))',
                border: hoveredCard === idx 
                  ? `1px solid rgba(239,68,68,0.5)` 
                  : '1px solid rgba(239,68,68,0.3)',
                borderRadius: 16,
                padding: 20,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: hoveredCard === idx 
                  ? `0 20px 60px -10px ${difficultyColor}40` 
                  : '0 10px 30px -10px rgba(0,0,0,0.3)'
              }}
            >
              {/* Glow effect */}
              <div style={{
                position: 'absolute',
                top: -100,
                right: -100,
                width: 200,
                height: 200,
                background: `radial-gradient(circle, ${difficultyColor}40, transparent)`,
                filter: 'blur(40px)',
                pointerEvents: 'none',
                opacity: hoveredCard === idx ? 0.8 : 0.6,
                transition: 'opacity 0.3s ease'
              }} />

              {/* Header with icon and badges */}
              <div style={{ position: 'relative', zIndex: 1, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <motion.div 
                    animate={{ 
                      scale: hoveredCard === idx ? 1.1 : 1,
                      rotate: hoveredCard === idx ? [0, -5, 5, 0] : 0
                    }}
                    transition={{ duration: 0.3 }}
                    style={{ 
                      fontSize: 48, 
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                      lineHeight: 1
                    }}
                  >
                    {icon}
                  </motion.div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <motion.span 
                      whileHover={{ scale: 1.05 }}
                      style={{
                        padding: '4px 10px',
                        background: `${difficultyColor}30`,
                        border: `1px solid ${difficultyColor}60`,
                        borderRadius: 12,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: difficultyColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {difficulty}
                    </motion.span>
                    <motion.span 
                      whileHover={{ scale: 1.05 }}
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(124,58,237,0.2)',
                        border: '1px solid rgba(124,58,237,0.4)',
                        borderRadius: 12,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#c084fc',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {priority}
                    </motion.span>
                  </div>
                </div>

                {challenge.title && (
                  <h4 style={{
                    margin: '0 0 12px 0',
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: '#f1f5f9',
                    lineHeight: 1.3
                  }}>
                    {challenge.title}
                  </h4>
                )}
              </div>

              {/* Challenge items */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                {challenge.items.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: idx * 0.1 + i * 0.05 }}
                    whileHover={{ x: 4, background: 'rgba(255,255,255,0.06)' }}
                    style={{
                      display: 'flex',
                      gap: 10,
                      marginBottom: i < challenge.items.length - 1 ? 10 : 0,
                      padding: 10,
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.08)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ 
                      color: difficultyColor, 
                      fontSize: '1.2em',
                      flexShrink: 0,
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }}>
                      {i === 0 ? '⚡' : i === 1 ? '🔍' : i === 2 ? '🎯' : '▸'}
                    </span>
                    <span style={{ 
                      color: '#cbd5e1', 
                      fontSize: '0.95rem',
                      lineHeight: 1.5
                    }}>
                      {item}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Progress indicator at bottom */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                background: `linear-gradient(90deg, ${difficultyColor}, transparent)`,
                opacity: hoveredCard === idx ? 0.8 : 0.6,
                transition: 'opacity 0.3s ease'
              }} />

              {/* Card number badge */}
              <div style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: `${difficultyColor}20`,
                border: `1px solid ${difficultyColor}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: difficultyColor,
                opacity: 0.7
              }}>
                {idx + 1}
              </div>
            </motion.div>
          )
        })}
      </div>
    )
  }

  // Helper to render markdown-like content with enhanced formatting and icons
  const renderContent = (content?: string, sectionType?: 'explanation' | 'challenges' | 'improvements') => {
    if (!content) return null
    
    // Icon mapping based on section type and content
    const getIconForBullet = (bullet: string, type?: string) => {
      if (bullet === '→') return '🔄'
      if (bullet === '✓') return '✅'
      
      // Context-aware icons
      if (type === 'challenges') return '⚠️'
      if (type === 'improvements') return '💡'
      return '📌'
    }
    
    const getNumberedIcon = (num: number, type?: string) => {
      const icons = {
        explanation: ['📖', '🔍', '🎯', '⚡', '🌟', '🔬', '📊', '🎓'],
        challenges: ['🚧', '⛔', '🔥', '⚙️', '🎲', '🔧', '⏰', '📉'],
        improvements: ['🚀', '✨', '🎨', '🤖', '📱', '☁️', '🔮', '⚙️']
      }
      const typeIcons = type ? icons[type as keyof typeof icons] : icons.explanation
      return typeIcons[num % typeIcons.length]
    }
    
    // Split by paragraphs and format - preserve empty lines for spacing
    const lines = content.split('\n')
    let numberedItemCount = 0
    const processedIndices = new Set<number>()
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {lines.map((line, i) => {
          // Skip if already processed as sub-bullet
          if (processedIndices.has(i)) {
            return null
          }
          
          // Skip empty lines but preserve spacing
          if (!line.trim()) {
            return <div key={i} style={{ height: 8 }} />
          }
          
          // Headers with gradient and icon
          if (line.startsWith('**') && line.endsWith('**')) {
            const text = line.slice(2, -2)
            const headerColor = sectionType === 'challenges' ? '#fca5a5' : sectionType === 'improvements' ? '#fcd34d' : '#93c5fd'
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                style={{ marginTop: i > 0 ? 24 : 0 }}
              >
                <h4 
                  id={slugify(text)} 
                  data-anchor={text} 
                  style={{ 
                    color: headerColor,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    background: `linear-gradient(135deg, ${sectionType === 'challenges' ? 'rgba(239,68,68,0.15)' : sectionType === 'improvements' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)'}, transparent)`,
                    borderRadius: 8,
                    borderLeft: `4px solid ${headerColor}`,
                    margin: 0
                  }}
                >
                  <span style={{ fontSize: '1.3em' }}>
                    {sectionType === 'challenges' ? '🎯' : sectionType === 'improvements' ? '🌟' : '📚'}
                  </span>
                  {text}
                </h4>
              </motion.div>
            )
          }
          
          // Numbered items (1. 2. 3.) with potential sub-bullets
          if (/^\d+\.\s/.test(line)) {
            const match = line.match(/^(\d+)\.\s(.*)/)
            if (match) {
              const num = parseInt(match[1]) - 1
              const text = match[2]
              numberedItemCount++
              
              // Collect sub-bullets (indented lines starting with -)
              const subBullets: string[] = []
              let j = i + 1
              while (j < lines.length && /^\s+[-–—]\s/.test(lines[j])) {
                subBullets.push(lines[j].trim().replace(/^[-–—]\s/, ''))
                processedIndices.add(j)
                j++
              }
              
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    padding: '14px 16px',
                    background: `linear-gradient(135deg, ${sectionType === 'challenges' ? 'rgba(239,68,68,0.08)' : sectionType === 'improvements' ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)'}, transparent)`,
                    borderRadius: 10,
                    border: `1px solid ${sectionType === 'challenges' ? 'rgba(239,68,68,0.2)' : sectionType === 'improvements' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)'}`,
                  }}
                >
                  <div style={{ display: 'flex', gap: 14 }}>
                    <span style={{ 
                      fontSize: '1.5em',
                      flexShrink: 0,
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                    }}>
                      {getNumberedIcon(num, sectionType)}
                    </span>
                    <span style={{ 
                      flex: 1,
                      color: '#e2e8f0',
                      lineHeight: 1.6,
                      fontWeight: 500
                    }}>
                      {text.includes('**') ? (
                        text.split('**').map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#fff' }}>{part}</strong> : part)
                      ) : text}
                    </span>
                  </div>
                  
                  {/* Render sub-bullets */}
                  {subBullets.length > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 6,
                      paddingLeft: 40,
                      marginTop: 4
                    }}>
                      {subBullets.map((bullet, idx) => (
                        <div key={idx} style={{ 
                          display: 'flex', 
                          gap: 10,
                          alignItems: 'flex-start',
                          color: '#cbd5e1',
                          fontSize: '0.95em',
                          lineHeight: 1.5
                        }}>
                          <span style={{ 
                            color: sectionType === 'challenges' ? '#fca5a5' : sectionType === 'improvements' ? '#fcd34d' : '#93c5fd',
                            flexShrink: 0
                          }}>▸</span>
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            }
          }
          
          // Bullet points with enhanced icons (also support dash-style bullets)
          if (line.startsWith('•') || line.startsWith('→') || line.startsWith('✓') || line.trim().startsWith('-') || line.trim().startsWith('–') || line.trim().startsWith('—')) {
            const trimmed = line.trim()
            const isDash = /^[-–—]\s?/.test(trimmed)
            const icon = isDash ? '-' : trimmed[0]
            const text = isDash ? trimmed.replace(/^[-–—]\s?/, '') : trimmed.slice(1).trim()
            const displayIcon = getIconForBullet(icon, sectionType)
            
            return (
              <motion.li 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.03 }}
                style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 12,
                  marginBottom: 6,
                  listStyle: 'none',
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: `linear-gradient(90deg, ${sectionType === 'challenges' ? 'rgba(239,68,68,0.05)' : sectionType === 'improvements' ? 'rgba(245,158,11,0.05)' : 'rgba(59,130,246,0.05)'}, transparent)`,
                }}
              >
                <span style={{ 
                  fontSize: '1.2em',
                  flexShrink: 0,
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
                }}>
                  {displayIcon}
                </span>
                <span style={{ 
                  color: sectionType === 'challenges' ? '#fecdd3' : sectionType === 'improvements' ? '#fde68a' : '#c7d2fe',
                  lineHeight: 1.6
                }}>
                  {text.includes('**') ? (
                    text.split('**').map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#fff' }}>{part}</strong> : part)
                  ) : text}
                </span>
              </motion.li>
            )
          }
          
          // Bold inline text
          if (line.includes('**')) {
            const parts = line.split('**')
            return (
              <motion.p 
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: i * 0.02 }}
                style={{ 
                  color: '#cbd5e1',
                  lineHeight: 1.7,
                  margin: '8px 0'
                }}
              >
                {parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#e2e8f0', fontWeight: 600 }}>{part}</strong> : part)}
              </motion.p>
            )
          }
          
          // Regular paragraph
          return (
            <motion.p 
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
              style={{ 
                color: '#cbd5e1',
                lineHeight: 1.7,
                margin: '8px 0'
              }}
            >
              {line}
            </motion.p>
          )
        })}
      </div>
    )
  }

  const hasChallenges = !!lesson.practicalChallenges
  const hasImprovements = !!lesson.improvementIdeas
  const caseStudyIndex = 1 + (hasChallenges ? 1 : 0) + (hasImprovements ? 1 : 0) + 1

  return (
    <div className="lesson-page">
      <div className="lesson-header">
        <h2>{lesson.title}</h2>
        <span className="reference-badge">{lesson.annexReference}</span>
      </div>

      {/* VISUALIZATION REMOVED FROM HERE - NOW IN FAB MODAL */}

      <motion.section 
        className="lesson-section" 
        style={{'--section-index': 1} as React.CSSProperties}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 24 }}>📚</span>
          <h3 style={{ margin: 0, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Razlaga in Razvoj Konceptov
          </h3>
        </div>
        <div 
          className="content-box" 
          style={{ 
            position: 'relative',
            background: 'linear-gradient(180deg, rgba(59,130,246,0.10), rgba(2,6,23,0.6))', 
            border: '1px solid rgba(59,130,246,0.35)',
            borderRadius: 16,
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none'
          }}>
            <div style={{
              position: 'absolute',
              top: -60,
              left: -80,
              width: 300,
              height: 300,
              background: 'radial-gradient(closest-side, rgba(59,130,246,0.3), transparent)',
              filter: 'blur(20px)'
            }} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            {renderContent(lesson.developmentAndExplanation, 'explanation')}
          </div>
        </div>
      </motion.section>

      {lesson.practicalChallenges && (
        <motion.section 
          className="lesson-section" 
          style={{'--section-index': 2} as React.CSSProperties}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ 
              fontSize: 32, 
              filter: 'drop-shadow(0 4px 12px rgba(239,68,68,0.4))',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              ⚠️
            </div>
            <div>
              <h3 style={{ 
                margin: 0, 
                background: 'linear-gradient(135deg,#ef4444,#f97316)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                fontSize: '1.8rem',
                fontWeight: 700
              }}>
                Praktični Izzivi
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                Realni scenariji in izzivi iz proizvodnega okolja
              </p>
            </div>
          </div>
          <div 
            className="content-box challenges"
            style={{ 
              position: 'relative',
              background: 'linear-gradient(180deg, rgba(239,68,68,0.10), rgba(2,6,23,0.6))', 
              border: '1px solid rgba(239,68,68,0.35)',
              borderRadius: 16,
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none'
            }}>
              <div style={{
                position: 'absolute',
                top: -60,
                right: -80,
                width: 300,
                height: 300,
                background: 'radial-gradient(closest-side, rgba(239,68,68,0.3), transparent)',
                filter: 'blur(20px)'
              }} />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              {renderContent(lesson.practicalChallenges, 'challenges')}
            </div>
          </div>
        </motion.section>
      )}

      {lesson.improvementIdeas && (
        <motion.section 
          className="lesson-section" 
          style={{'--section-index': 3} as React.CSSProperties}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>💡</span>
            <h3 style={{ margin: 0, background: 'linear-gradient(135deg,#f59e0b,#eab308)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Ideje za Izboljšave
            </h3>
          </div>
          <div 
            className="content-box improvements"
            style={{ 
              position: 'relative',
              background: 'linear-gradient(180deg, rgba(245,158,11,0.10), rgba(2,6,23,0.6))', 
              border: '1px solid rgba(245,158,11,0.35)',
              borderRadius: 16,
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none'
            }}>
              <div style={{
                position: 'absolute',
                bottom: -80,
                left: -100,
                width: 320,
                height: 320,
                background: 'radial-gradient(closest-side, rgba(245,158,11,0.25), transparent)',
                filter: 'blur(20px)'
              }} />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              {renderContent(lesson.improvementIdeas, 'improvements')}
            </div>
          </div>
        </motion.section>
      )}

      {/* Real-World Case Study section (always rendered; uses per-lesson content with fallback) */}
      {/* Real-World Case Study section (always rendered; uses per-lesson content with fallback) */}
      <motion.section 
        className="lesson-section" 
        style={{'--section-index': caseStudyIndex} as React.CSSProperties}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      > <RealWorldCaseStudy />
      </motion.section>

      {/* REMOVED OLD QUIZ SECTION - NOW IN FAB */}

      {/* QUIZ MODAL WITH LOADING ANIMATION */}
      <AnimatePresence>
        {showQuiz && (
          <>
            {/* Backdrop with particles */}
            <motion.div
              className="quiz-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuiz(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(10px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0',
                overflow: 'hidden'
              }}
            >
              {/* Animated particles background */}
              <div style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none'
              }}>
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: Math.random() * window.innerWidth,
                      y: window.innerHeight + 100,
                      opacity: 0
                    }}
                    animate={{ 
                      y: -100,
                      opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                      ease: 'linear'
                    }}
                    style={{
                      position: 'absolute',
                      width: 4 + Math.random() * 4,
                      height: 4 + Math.random() * 4,
                      borderRadius: '50%',
                      background: `hsl(${Math.random() * 60 + 250}, 70%, 60%)`,
                      boxShadow: '0 0 10px currentColor'
                    }}
                  />
                ))}
              </div>

              {/* Modal Content */}
              <motion.div
                className="quiz-modal"
                initial={{ opacity: 0, scale: 0.8, rotateX: -15 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotateX: 15 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'relative',
                  width: '95vw',
                  maxWidth: '1100px',
                  height: '90vh',
                  maxHeight: '900px',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  borderRadius: '24px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(124, 58, 237, 0.4)',
                  border: '2px solid rgba(124, 58, 237, 0.3)',
                  overflow: 'hidden'
                }}
              >
                {/* Animated border glow */}
                <motion.div
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  style={{
                    position: 'absolute',
                    inset: -2,
                    background: 'linear-gradient(135deg, #7c3aed, #06b6d4, #7c3aed)',
                    borderRadius: 24,
                    opacity: 0.3,
                    zIndex: -1,
                    filter: 'blur(8px)'
                  }}
                />
                {/* Close button */}
                <button
                  onClick={() => setShowQuiz(false)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '24px',
                    transition: 'all 0.2s',
                    zIndex: 10,
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                    e.currentTarget.style.borderColor = '#ef4444'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                  }}
                >
                  ✕
                </button>

                {/* Modal Header - Fixed */}
                <div style={{
                  textAlign: 'center',
                  padding: '24px 70px 20px 24px',
                  borderBottom: '2px solid rgba(124, 58, 237, 0.3)',
                  flexShrink: 0,
                  background: 'linear-gradient(180deg, rgba(124, 58, 237, 0.1) 0%, transparent 100%)'
                }}>
                  <h2 style={{
                    margin: '0 0 8px 0',
                    fontSize: 'clamp(20px, 4vw, 32px)',
                    background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 800,
                    lineHeight: 1.2
                  }}>
                    🎯 {lesson.title}
                  </h2>
                  <p style={{
                    margin: 0,
                    fontSize: 'clamp(13px, 2vw, 16px)',
                    color: '#94a3b8'
                  }}>
                    {(finalQuestions?.length || lesson.quizQuestions?.length || 0)} vprašanj • Za uspeh potrebujete 55%+
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                    Dogodek: <strong style={{color:'#cbd5e1'}}>{currentEvent}</strong>
                  </p>
                </div>

                {/* Quiz Content - Scrollable */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  padding: '24px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#7c3aed rgba(15, 23, 42, 0.5)'
                }}>
                  {finalQuestions && finalQuestions.length > 0 ? (
                    <Quiz
                      lessonId={lesson.id}
                      questions={finalQuestions as any}
                      onSubmit={(score, answers)=>{
                        if (!user) return
                        // Build review details for admin (which were wrong, etc.)
                        const qList = (finalQuestions as any)
                        const review = qList.map((q: any, i: number) => {
                          const selected = answers[i]
                          const correct = q.correctAnswerIndex
                          return {
                            index: i,
                            question: q.question,
                            selectedIndex: selected,
                            correctIndex: correct,
                            selectedText: selected >= 0 ? q.options[selected] : null,
                            correctText: q.options[correct],
                            isCorrect: selected === correct
                          }
                        })
                        const finishedAt = Date.now()
                        cms.submitQuizAttempt({
                          user: user.username||'anon',
                          userId: user.id,
                          lessonId: lesson.id,
                          score,
                          totalQuestions: qList.length,
                          answers,
                          review,
                          finishedAt
                        })
                      }}
                      onSaveComment={(comment)=>{
                        if (!user) return
                        cms.addAttemptComment(user.id, lesson.id, comment)
                      }}
                    />
                  ) : (
                    <p style={{textAlign: 'center', color: '#94a3b8'}}>Ni kviza za to lekcijo.</p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION BUTTONS - QUIZ & VISUALIZATIONS */}
      
      {/* FAB - QUIZ (bottom right, higher position) */}
      <motion.button
        className="fab-quiz"
        onClick={() => {
          if (!user || !lesson) { setShowQuiz(true); return }
          try {
            const attempts = JSON.parse(localStorage.getItem('mock_attempts') || '[]') as any[]
            const count = attempts.filter(a => a.userId === user.id && (a.lessonId === lesson.id || a.lesson === lesson.id)).length
            const allowed = getAllowedAttempts(user.id, lesson.id, 2)
            if (count >= allowed) {
              setShowAttemptLimit(true)
            } else {
              setShowQuiz(true)
            }
          } catch {
            setShowQuiz(true)
          }
        }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1, rotate: -5 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.1 }}
        style={{
          position: 'fixed',
          bottom: '120px',
          right: '32px',
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          border: '3px solid rgba(255, 255, 255, 0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          zIndex: 999
        }}
      >
        🎯
      </motion.button>

      {/* FAB - VISUALIZATIONS (bottom right, lower position) */}
      {lesson.slug && (
        <motion.button
          className="fab-visualizations"
          onClick={() => setShowVisualizations(true)}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            border: '3px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            zIndex: 999
          }}
        >
          🎬
        </motion.button>
      )}

      {/* VISUALIZATIONS MODAL WITH LOADING ANIMATION */}
      <AnimatePresence>
        {showVisualizations && lesson.slug && (
          <>
            {/* Backdrop with animated rays */}
            <motion.div
              className="visualizations-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVisualizations(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(10px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                overflow: 'auto'
              }}
            >
              {/* Animated light rays */}
              <div style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                pointerEvents: 'none'
              }}>
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      rotate: (i * 30) - 90,
                      scale: 0,
                      opacity: 0
                    }}
                    animate={{ 
                      rotate: (i * 30) - 90,
                      scale: 1,
                      opacity: [0, 0.3, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: 'easeInOut'
                    }}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: 4,
                      height: '50%',
                      background: `linear-gradient(to bottom, ${i % 2 === 0 ? '#7c3aed' : '#06b6d4'}, transparent)`,
                      transformOrigin: 'top center',
                      filter: 'blur(2px)'
                    }}
                  />
                ))}
              </div>

              {/* Modal Content */}
              <motion.div
                className="visualizations-modal"
                initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotateY: 15 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'relative',
                  width: '95vw',
                  maxWidth: '1400px',
                  maxHeight: '90vh',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  borderRadius: '24px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(124, 58, 237, 0.4)',
                  border: '2px solid rgba(124, 58, 237, 0.3)',
                  overflow: 'hidden'
                }}
              >
                {/* Animated border glow */}
                <motion.div
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  style={{
                    position: 'absolute',
                    inset: -2,
                    background: 'linear-gradient(135deg, #7c3aed, #06b6d4, #7c3aed)',
                    borderRadius: 24,
                    opacity: 0.3,
                    zIndex: -1,
                    filter: 'blur(8px)'
                  }}
                />
                {/* Close button */}
                <button
                  onClick={() => setShowVisualizations(false)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '24px',
                    transition: 'all 0.2s',
                    zIndex: 10,
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                    e.currentTarget.style.borderColor = '#ef4444'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                  }}
                >
                  ✕
                </button>

                {/* Modal Header - Fixed */}
                <div style={{
                  textAlign: 'center',
                  padding: '24px 70px 20px 24px',
                  borderBottom: '2px solid rgba(124, 58, 237, 0.3)',
                  flexShrink: 0,
                  background: 'linear-gradient(180deg, rgba(124, 58, 237, 0.1) 0%, transparent 100%)'
                }}>
                  <h2 style={{
                    margin: '0 0 8px 0',
                    fontSize: 'clamp(20px, 4vw, 32px)',
                    background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 800,
                    lineHeight: 1.2
                  }}>
                    🎬 Interaktivne Vizualizacije
                  </h2>
                  <p style={{
                    margin: 0,
                    fontSize: 'clamp(13px, 2vw, 16px)',
                    color: '#94a3b8'
                  }}>
                    {lesson.title}
                  </p>
                </div>

                {/* Visualizations Content - Scrollable */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  padding: '24px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#7c3aed rgba(15, 23, 42, 0.5)'
                }}>
                  <LessonVisualization slug={lesson.slug} />
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CSS for FAB animations */}
      <style>{`
        /* Visualizations FAB pulse */
        .fab-visualizations {
          animation: pulse-viz 2s infinite !important;
        }
        
        @keyframes pulse-viz {
          0%, 100% {
            box-shadow: 0 10px 40px rgba(124, 58, 237, 0.5), 0 0 0 0 rgba(124, 58, 237, 0.4);
          }
          50% {
            box-shadow: 0 10px 40px rgba(124, 58, 237, 0.7), 0 0 0 10px rgba(124, 58, 237, 0);
          }
        }
        
        /* Quiz FAB pulse */
        .fab-quiz {
          animation: pulse-quiz 2s infinite 0.5s !important;
        }
        
        @keyframes pulse-quiz {
          0%, 100% {
            box-shadow: 0 10px 40px rgba(245, 158, 11, 0.5), 0 0 0 0 rgba(245, 158, 11, 0.4);
          }
          50% {
            box-shadow: 0 10px 40px rgba(245, 158, 11, 0.7), 0 0 0 10px rgba(245, 158, 11, 0);
          }
        }

        /* Challenge icon pulse animation */
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 4px 12px rgba(239,68,68,0.4));
          }
          50% {
            transform: scale(1.05);
            filter: drop-shadow(0 6px 20px rgba(239,68,68,0.6));
          }
        }
      `}</style>
      {/* Attempt limit modal */}
      <AnimatePresence>
        {showAttemptLimit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center' }}
            onClick={()=>setShowAttemptLimit(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e)=>e.stopPropagation()}
              style={{ background:'#0b1220', border:'1px solid rgba(124,58,237,0.4)', borderRadius:16, padding:24, width:'min(520px, 92vw)' }}
            >
              <h3 style={{ marginTop:0 }}>Dosežena omejitev poskusov</h3>
              <p style={{ color:'#94a3b8' }}>Za ta kviz sta privzeto dovoljena največ 2 poskusa. Če želite nadaljevati, pošljite prošnjo administratorju za dodatne poskuse.</p>
              {requestSent ? (
                <div style={{ color:'#22c55e', fontWeight:600 }}>Prošnja poslana. Administrator bo pregledal in odobril dodatne poskuse.</div>
              ) : (
                <div style={{ display:'flex', gap:12, marginTop:16 }}>
                  <button className="btn-ghost" onClick={()=>setShowAttemptLimit(false)}>Prekliči</button>
                  <button className="btn-primary" onClick={()=>{
                    if (!user || !lesson) return
                    addRequest({ userId: user.id, username: user.username, lessonId: lesson.id })
                    setRequestSent(true)
                    setTimeout(()=>{ setShowAttemptLimit(false); setRequestSent(false) }, 1200)
                  }}>Pošlji prošnjo</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
