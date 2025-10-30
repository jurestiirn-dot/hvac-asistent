import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useQuizConfig } from '../contexts/QuizConfigContext'
import { useAvatar } from '../contexts/AvatarContext'

type Question = {
  question: string
  options: string[]
  correctAnswerIndex: number
  explanation?: string
  hint?: string
}

export default function Quiz({ questions, onSubmit, onSaveComment, lessonId }: { questions: Question[], onSubmit?: (score:number, answers:number[])=>void, onSaveComment?: (comment: string)=>void, lessonId?: number }) {
  const [answers, setAnswers] = React.useState<number[]>(Array(questions.length).fill(-1))
  const [submitted, setSubmitted] = React.useState(false)
  const [comment, setComment] = React.useState('')
  const [score, setScore] = React.useState(0)
  const [currentQ, setCurrentQ] = React.useState(0)
  const [showExplanation, setShowExplanation] = React.useState(false)
  const [hintsUsed, setHintsUsed] = React.useState<Set<number>>(new Set())
  const [showHintForQuestion, setShowHintForQuestion] = React.useState<number | null>(null)
  const [eliminatedOptions, setEliminatedOptions] = React.useState<Record<number, number[]>>({}) // qIndex -> eliminated option indices
  const [fiftyUsedCount, setFiftyUsedCount] = React.useState(0)
  const { currentEvent, config } = useQuizConfig()
  const eventCfg = config[currentEvent]
  const avatar = useAvatar()

  // Announce quiz mount/unmount to avatar for positioning
  React.useEffect(()=>{
    const anchor = document.querySelector('.quiz-question-card') as HTMLElement | null
    avatar.onQuizStart(anchor)
    return () => avatar.onQuizEnd()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Generate hint for questions that don't have one
  const getHint = (q: Question, qIndex: number): string => {
    if (q.hint) return q.hint
    
    // Auto-generate hint by eliminating one incorrect option
    const incorrectOptions = q.options
      .map((opt, idx) => ({ opt, idx }))
      .filter(({ idx }) => idx !== q.correctAnswerIndex)
    
    if (incorrectOptions.length > 0) {
      // Pick a random incorrect option to eliminate
      const randomIncorrect = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)]
      return `💡 Namig: Odgovor "${randomIncorrect.opt}" NI pravilen. Izključite ga iz izbire.`
    }
    
    return "💡 Razmislite o ključnih konceptih iz lekcije."
  }

  const select = (qIndex:number, optIndex:number) => {
    const next = [...answers]
    next[qIndex] = optIndex
    setAnswers(next)
    setShowHintForQuestion(null) // Hide hint when answer selected
    
    // Drive avatar reaction
    const q = questions[qIndex]
    const correct = optIndex === q.correctAnswerIndex
    const labelEl = document.querySelector(`label[data-q='${qIndex}'][data-o='${optIndex}']`) as HTMLElement | null
    avatar.onOptionSelect(!!correct, labelEl)

    // Auto-advance with animation after selection
    if (!submitted) {
      setTimeout(() => {
        if (qIndex < questions.length - 1) {
          setCurrentQ(qIndex + 1)
        }
      }, 300)
    }
  }

  // Get lesson-specific limits or fall back to global
  const getLessonHintLimit = () => {
    if (!eventCfg) return 3
    const lessonLimit = lessonId !== undefined ? eventCfg.lessonHintLimits?.[lessonId] : undefined
    if (lessonLimit !== undefined) return lessonLimit
    return eventCfg.maxHints
  }

  const getLessonFiftyFiftyLimit = () => {
    if (!eventCfg) return 2
    const lessonLimit = lessonId !== undefined ? eventCfg.lessonFiftyFiftyLimits?.[lessonId] : undefined
    if (lessonLimit !== undefined) return lessonLimit
    return eventCfg.maxFiftyFifty
  }

  const maxHints = getLessonHintLimit()
  const hintsUnlimited = maxHints < 0
  const toggleHint = (qIndex: number) => {
    const limitReached = !hintsUnlimited && hintsUsed.size >= maxHints
    if (!hintsUsed.has(qIndex) && !limitReached) {
      setHintsUsed(new Set(hintsUsed).add(qIndex))
      setShowHintForQuestion(qIndex)
    } else if (hintsUsed.has(qIndex)) {
      // Toggle visibility for already used hint
      setShowHintForQuestion(showHintForQuestion === qIndex ? null : qIndex)
    }
  }

  const canUseHint = (qIndex: number) => {
    if (!eventCfg?.allowHints) return false
    if (hintsUnlimited) return true
    return hintsUsed.has(qIndex) || hintsUsed.size < maxHints
  }

  const canUseFiftyFifty = () => {
    if (!eventCfg?.allowFiftyFifty) return false
    const max = getLessonFiftyFiftyLimit()
    return max < 0 || fiftyUsedCount < max
  }

  const useFiftyFifty = (qIndex: number) => {
    if (!canUseFiftyFifty()) return
    const q = questions[qIndex]
    const incorrect = q.options.map((_, idx) => idx).filter(idx => idx !== q.correctAnswerIndex)
    // randomly eliminate two incorrect options
    const shuffled = [...incorrect].sort(() => Math.random() - 0.5)
    const toEliminate = shuffled.slice(0, Math.min(2, incorrect.length))
    setEliminatedOptions(prev => ({ ...prev, [qIndex]: toEliminate }))
    setFiftyUsedCount(c => c + 1)
  }

  const submit = () => {
    let s = 0
    questions.forEach((q, i) => { if (answers[i] === q.correctAnswerIndex) s++ })
    setScore(s)
    setSubmitted(true)
    setCurrentQ(0)
    setShowExplanation(true)
  if (onSubmit) onSubmit(s, answers)
    avatar.onSubmit(s, questions.length)
    
    // Celebration effect for passing scores (55%+)
    const percentage = (s / questions.length) * 100
    const passed = percentage >= 55
    
    if (passed && percentage >= 70) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#7c3aed', '#06b6d4', '#22c55e']
      })
    } else if (passed) {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 }
      })
    }
  }

  const allAnswered = answers.every(a => a !== -1)
  const progress = ((answers.filter(a => a !== -1).length) / questions.length) * 100

  return (
    <div className="quiz card">
      {!submitted && (
        <div className="quiz-progress">
          <div className="progress-bar">
            <motion.div 
              className="progress-fill" 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4}}>
            <p style={{fontSize:12,color:'var(--muted)',margin:0}}>
              Odgovorjeno: {answers.filter(a => a !== -1).length} / {questions.length}
            </p>
            <p style={{fontSize:12,color:'var(--muted)',margin:0}}>
              {eventCfg?.allowHints !== false && (
                <>💡 Namigi: {hintsUsed.size} / {hintsUnlimited ? '∞' : maxHints}</>
              )}
              {eventCfg?.allowFiftyFifty && (
                <> &nbsp;•&nbsp; 🌓 50/50: {fiftyUsedCount} / {getLessonFiftyFiftyLimit() < 0 ? '∞' : getLessonFiftyFiftyLimit()}</>
              )}
            </p>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {questions.map((q, qi) => qi === currentQ && (
              <div className="quiz-question-card" key={qi}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}}>
                  <h4 style={{marginTop:0,flex:1}}>
                    <span className="q-number">{qi+1}</span> {q.question}
                  </h4>
                  <motion.button
                    className="hint-btn"
                    onClick={() => toggleHint(qi)}
                    disabled={!canUseHint(qi)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={canUseHint(qi) ? (hintsUsed.has(qi) ? 'Prikaži/Skrij namig' : 'Prikaži namig') : 'Namigi niso dovoljeni ali je dosežena omejitev'}
                  >
                    💡 <span className="hint-label">
                      {showHintForQuestion === qi && hintsUsed.has(qi) ? 'Skrij' : 'Namig'}
                    </span>
                  </motion.button>
                  {eventCfg?.allowFiftyFifty && (
                    <motion.button
                      className="hint-btn"
                      onClick={() => useFiftyFifty(qi)}
                      disabled={!canUseFiftyFifty()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title={canUseFiftyFifty() ? 'Uporabi polovičko (50/50)' : '50/50 ni dovoljen ali je omejitev dosežena'}
                    >
                      🌓 <span className="hint-label">50/50</span>
                    </motion.button>
                  )}
                </div>
                
                <AnimatePresence>
                  {showHintForQuestion === qi && hintsUsed.has(qi) && (
                    <motion.div
                      className="hint-box"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="hint-content">{getHint(q, qi)}</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="quiz-options-grid">
                  {q.options.map((opt, oi) => {
                    const isSelected = answers[qi] === oi
                    const isEliminated = (eliminatedOptions[qi] || []).includes(oi)
                    return (
                      <motion.label 
                        key={oi}
                        className={`quiz-option ${isSelected ? 'selected' : ''}`}
                        data-q={qi}
                        data-o={oi}
                        style={isEliminated ? { opacity: 0.35, pointerEvents: 'none', filter: 'grayscale(1)' } : undefined}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onMouseEnter={(e)=> avatar.onOptionHover(e.currentTarget)}
                        onMouseLeave={()=> avatar.onOptionLeave()}
                      >
                        <input 
                          type="radio" 
                          name={`q${qi}`} 
                          checked={isSelected} 
                          onChange={()=>select(qi, oi)}
                          style={{display:'none'}}
                        />
                        <span className="option-check">{isSelected ? '✓' : ''}</span>
                        <span>{opt}</span>
                      </motion.label>
                    )
                  })}
                </div>
                <div className="quiz-nav">
                  {qi > 0 && (
                    <button className="btn-ghost" onClick={() => setCurrentQ(qi - 1)}>← Prejšnje</button>
                  )}
                  {qi < questions.length - 1 && (
                    <button className="btn-ghost" onClick={() => setCurrentQ(qi + 1)}>Naslednje →</button>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="quiz-results">
              <motion.div 
                className="score-circle"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.6 }}
              >
                <div className="score-value">{score}</div>
                <div className="score-total">/ {questions.length}</div>
              </motion.div>
              {(() => {
                const percentage = ((score/questions.length)*100).toFixed(0)
                const passed = Number(percentage) >= 55
                return (
                  <>
                    <h3>{passed ? (score === questions.length ? '🎉 Odlično - 100%!' : Number(percentage) >= 80 ? '🌟 Zelo dobro!' : '✅ Uspešno opravljeno!') : '❌ Neuspešno'}</h3>
                    <div className={`pass-status ${passed ? 'passed' : 'failed'}`}>
                      {passed ? 'USPEH - Usposabljanje opravljeno' : 'NEUSPEH - Potrebno ponovno'}
                    </div>
                    <p style={{fontSize:18,fontWeight:600,marginTop:12}}>Dosegel si {percentage}% pravilnih odgovorov</p>
                    <p style={{fontSize:14,color:'var(--muted)'}}>
                      {passed ? 'Čestitamo! Minimalni prag za uspeh je 55%.' : 'Za uspešno opravljeno usposabljanje potrebuješ vsaj 55% pravilnih odgovorov.'}
                    </p>
                  </>
                )
              })()}
            </div>

            <div className="quiz-review">
              <h4>Pregled odgovorov</h4>
              {questions.map((q, qi) => {
                const correct = answers[qi] === q.correctAnswerIndex
                return (
                  <motion.div 
                    key={qi}
                    className={`review-item ${correct ? 'correct' : 'incorrect'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: qi * 0.1 }}
                  >
                    <div className="review-header">
                      <span className="review-icon">{correct ? '✓' : '✗'}</span>
                      <h5>{qi+1}. {q.question}</h5>
                    </div>
                    <p className="review-answer">
                      <strong>Tvoj odgovor:</strong> {answers[qi] >= 0 ? q.options[answers[qi]] : 'Ni odgovora'}
                    </p>
                    {!correct && (
                      <p className="review-correct">
                        <strong>Pravilen odgovor:</strong> {q.options[q.correctAnswerIndex]}
                      </p>
                    )}
                    {q.explanation && showExplanation && (
                      <p className="review-explanation">
                        <strong>Obrazložitev:</strong> {q.explanation}
                      </p>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Optional user comment after quiz */}
            <div className="quiz-comment" style={{marginTop:16}}>
              <label style={{display:'block', fontWeight:600, marginBottom:6}}>Opomba/komentar (neobvezno)</label>
              <textarea
                value={comment}
                onChange={(e)=>setComment(e.target.value)}
                placeholder="Delite opažanja, težave ali predloge..."
                rows={3}
                style={{width:'100%', borderRadius:8, padding:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.12)', color:'white'}}
              />
              <div style={{display:'flex', justifyContent:'flex-end', marginTop:8}}>
                <button className="btn-ghost" disabled={!comment.trim()} onClick={()=> onSaveComment && onSaveComment(comment.trim())}>Pošlji komentar</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!submitted && (
        <motion.div 
          style={{marginTop:20}}
          initial={{ opacity: 0 }}
          animate={{ opacity: allAnswered ? 1 : 0.5 }}
        >
          <button 
            className="btn-primary" 
            onClick={submit}
            disabled={!allAnswered}
            style={{width:'100%'}}
          >
            Oddaj odgovore
          </button>
        </motion.div>
      )}
    </div>
  )
}
