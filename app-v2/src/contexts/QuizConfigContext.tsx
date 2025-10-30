import React from 'react'

export type QuizEventConfig = {
  allowHints: boolean
  maxHints: number // -1 = unlimited, global default
  allowFiftyFifty: boolean
  maxFiftyFifty: number // -1 = unlimited, global default
  questionOverrides?: Record<number, number> // lessonId -> desired number of questions
  lessonHintLimits?: Record<number, number> // lessonId -> max hints for that lesson (-1 = use global)
  lessonFiftyFiftyLimits?: Record<number, number> // lessonId -> max fifty-fifty for that lesson (-1 = use global)
}

type QuizConfigState = {
  currentEvent: string
  config: Record<string, QuizEventConfig>
  setCurrentEvent: (event: string) => void
  updateEventConfig: (event: string, cfg: Partial<QuizEventConfig>) => void
}

const DEFAULT_EVENT = 'default'

const defaultEventConfig: QuizEventConfig = {
  allowHints: true,
  maxHints: 3, // Changed from -1 to 3 as default limit
  allowFiftyFifty: true,
  maxFiftyFifty: 2, // Changed from -1 to 2 as default limit
  questionOverrides: {
    109: 25 // Lesson 109 should have 25 questions by default
  },
  lessonHintLimits: {}, // Per-lesson hint limits (empty = use global)
  lessonFiftyFiftyLimits: {} // Per-lesson fifty-fifty limits (empty = use global)
}

const STORAGE_KEY = 'quiz_config_state_v1'

function loadState(): { currentEvent: string, config: Record<string, QuizEventConfig> } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { currentEvent: DEFAULT_EVENT, config: { [DEFAULT_EVENT]: defaultEventConfig } }
}

function saveState(state: { currentEvent: string, config: Record<string, QuizEventConfig> }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

export const QuizConfigContext = React.createContext<QuizConfigState>({
  currentEvent: DEFAULT_EVENT,
  config: { [DEFAULT_EVENT]: defaultEventConfig },
  setCurrentEvent: () => {},
  updateEventConfig: () => {}
})

export function QuizConfigProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState(loadState())

  const setCurrentEvent = (event: string) => {
    setState(prev => {
      const next = { ...prev, currentEvent: event, config: { ...prev.config } }
      if (!next.config[event]) next.config[event] = { ...defaultEventConfig }
      saveState(next)
      return next
    })
  }

  const updateEventConfig = (event: string, cfg: Partial<QuizEventConfig>) => {
    setState(prev => {
      const existing = prev.config[event] || { ...defaultEventConfig }
      const nextCfg: QuizEventConfig = { ...existing, ...cfg }
      const next = { ...prev, config: { ...prev.config, [event]: nextCfg } }
      saveState(next)
      return next
    })
  }

  const value: QuizConfigState = {
    currentEvent: state.currentEvent,
    config: state.config,
    setCurrentEvent,
    updateEventConfig
  }

  return (
    <QuizConfigContext.Provider value={value}>
      {children}
    </QuizConfigContext.Provider>
  )
}

export function useQuizConfig() {
  return React.useContext(QuizConfigContext)
}
