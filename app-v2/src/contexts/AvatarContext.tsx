import React from 'react'

export type AvatarEmotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'mischievous' | 'thinking' | 'speaking'

type Vec2 = { x: number; y: number }

type AvatarState = {
  emotion: AvatarEmotion
  pos: Vec2
  lookAt?: Vec2 | null
  visible: boolean
  mode: 'wander' | 'quiz'
}

type AvatarAPI = {
  state: AvatarState
  setEmotion: (e: AvatarEmotion, ttlMs?: number) => void
  moveTo: (p: Vec2) => void
  lookAt: (p: Vec2 | null) => void
  onQuizStart: (anchor?: HTMLElement | null) => void
  onQuizEnd: () => void
  onOptionHover: (el: HTMLElement | null) => void
  onOptionLeave: () => void
  onOptionSelect: (correct: boolean, el?: HTMLElement | null) => void
  onSubmit: (score: number, total: number) => void
}

const AvatarContext = React.createContext<AvatarAPI | null>(null)

export function useAvatar() {
  const ctx = React.useContext(AvatarContext)
  if (!ctx) throw new Error('useAvatar must be used within AvatarProvider')
  return ctx
}

export function AvatarProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AvatarState>({
    emotion: 'neutral',
    pos: { x: 60, y: typeof window !== 'undefined' ? (window.innerHeight - 120) : 400 },
    lookAt: null,
    visible: true,
    mode: 'wander',
  })

  // Smoothly drift back to edges when idle
  React.useEffect(() => {
    let raf = 0
    let last = performance.now()
    const step = () => {
      const now = performance.now()
      const dt = Math.min(33, now - last)
      last = now
      setState((s) => {
        const target = targetRef.current
        const p = { ...s.pos }
        const k = 0.08
        p.x += (target.x - p.x) * k
        p.y += (target.y - p.y) * k
        return { ...s, pos: p }
      })
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  const targetRef = React.useRef<Vec2>({ x: 60, y: typeof window !== 'undefined' ? (window.innerHeight - 120) : 400 })
  const emotionTimeout = React.useRef<number | null>(null)

  const moveTo = (p: Vec2) => {
    targetRef.current = p
  }

  const lookAt = (p: Vec2 | null) => {
    setState(s => ({ ...s, lookAt: p }))
  }

  const setEmotion = (e: AvatarEmotion, ttlMs?: number) => {
    setState(s => ({ ...s, emotion: e }))
    if (emotionTimeout.current) window.clearTimeout(emotionTimeout.current)
    if (ttlMs && ttlMs > 0) {
      emotionTimeout.current = window.setTimeout(() => {
        setState(s => ({ ...s, emotion: 'neutral' }))
      }, ttlMs)
    }
  }

  const boundingCenter = (el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  }

  const perchNear = (el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    const x = r.left - 80
    const y = r.top + r.height / 2
    return { x: Math.max(40, x), y }
  }

  const onQuizStart = (anchor?: HTMLElement | null) => {
    setState(s => ({ ...s, mode: 'quiz', visible: true }))
    const base = anchor ? perchNear(anchor) : { x: 120, y: 220 }
    moveTo(base)
    setEmotion('thinking')
  }

  const onQuizEnd = () => {
    setState(s => ({ ...s, mode: 'wander' }))
    setEmotion('happy', 1200)
    moveTo({ x: 60, y: typeof window !== 'undefined' ? (window.innerHeight - 120) : 400 })
    lookAt(null)
  }

  const onOptionHover = (el: HTMLElement | null) => {
    if (!el) return
    setEmotion('mischievous')
    moveTo(perchNear(el))
    lookAt(boundingCenter(el))
  }

  const onOptionLeave = () => {
    setEmotion('thinking')
    lookAt(null)
  }

  const onOptionSelect = (correct: boolean, el?: HTMLElement | null) => {
    setEmotion(correct ? 'happy' : 'angry', 1000)
    if (el) lookAt(boundingCenter(el))
  }

  const onSubmit = (score: number, total: number) => {
    const passed = (score / total) >= 0.55
    setEmotion(passed ? 'happy' : 'sad', 1500)
  }

  const api: AvatarAPI = {
    state,
    setEmotion,
    moveTo,
    lookAt,
    onQuizStart,
    onQuizEnd,
    onOptionHover,
    onOptionLeave,
    onOptionSelect,
    onSubmit,
  }

  return <AvatarContext.Provider value={api}>{children}</AvatarContext.Provider>
}
