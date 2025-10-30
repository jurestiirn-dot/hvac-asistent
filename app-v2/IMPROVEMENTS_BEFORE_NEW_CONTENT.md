# 🔧 Kritične Izboljšave Pred Dodajanjem Novih Tem

## ❗ NUJNO - Tehnične Napake

### 1. **TypeScript Type Errors** 🔴
**Problem:**
- Missing type declarations za `canvas-confetti`, `three`
- Deprecated `moduleResolution: Node` v tsconfig.json

**Rešitev:**
```bash
npm install --save-dev @types/canvas-confetti @types/three
```

**tsconfig.json popravek:**
```json
{
  "compilerOptions": {
    "moduleResolution": "Bundler",  // ali "NodeNext"
    "ignoreDeprecations": "6.0"
  }
}
```

---

## 🚨 VISOKA PRIORITETA

### 2. **Error Handling & User Feedback** ⚠️
**Trenutno stanje:**
- Ni global error boundary
- Network errors niso obravnavani
- Loading states niso konsistentni

**Implementiraj:**

#### A) **Global Error Boundary**
```tsx
// src/components/ErrorBoundary.tsx
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
    // Send to analytics/monitoring service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          background: 'linear-gradient(135deg, #1e293b, #0f172a)'
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              maxWidth: 500,
              padding: 40,
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 20,
              border: '2px solid rgba(239, 68, 68, 0.3)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 20 }}>⚠️</div>
            <h2 style={{ color: '#ef4444', marginBottom: 16 }}>Nekaj je šlo narobe</h2>
            <p style={{ color: '#94a3b8', marginBottom: 24 }}>
              {this.state.error?.message || 'Aplikacija je naletela na napako'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🔄 Osveži Stran
            </button>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}
```

**Wrap App v main.tsx:**
```tsx
import ErrorBoundary from './components/ErrorBoundary'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
```

#### B) **Network Error Handling v CMS**
```tsx
// src/services/cms.ts
export async function fetchLessonBySlug(slug: string): Promise<Lesson | null> {
  try {
    if (!STRAPI_URL) {
      const allLessons = [...(annex1Lessons as Lesson[]), ...(annex1Advanced as Lesson[])]
      const lesson = allLessons.find(l => l.slug === slug)
      return lesson || null
    }

    const res = await api.get(`/api/lessons?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=deep`)
    const data = res.data.data[0]
    if (!data) return null
    return { id: data.id, ...data.attributes }
  } catch (error) {
    console.error(`Failed to fetch lesson ${slug}:`, error)
    throw new Error('Ni bilo mogoče naložiti lekcije. Preverite internetno povezavo.')
  }
}
```

#### C) **Toast Notification System**
```tsx
// src/components/Toast.tsx
import { motion, AnimatePresence } from 'framer-motion'
import { createContext, useContext, useState, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36)
    setToasts(prev => [...prev, { id, message, type }])
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const getIcon = (type: ToastType) => {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }
    return icons[type]
  }

  const getColor = (type: ToastType) => {
    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#fbbf24',
      info: '#06b6d4'
    }
    return colors[type]
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              style={{
                padding: '16px 20px',
                background: 'rgba(15, 23, 42, 0.95)',
                border: `2px solid ${getColor(toast.type)}`,
                borderRadius: 16,
                minWidth: 300,
                maxWidth: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: `0 10px 40px ${getColor(toast.type)}33`,
                backdropFilter: 'blur(10px)'
              }}
            >
              <span style={{ fontSize: 24 }}>{getIcon(toast.type)}</span>
              <span style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
```

**Uporaba:**
```tsx
const { showToast } = useToast()

// Success
showToast('Kviz uspešno oddan!', 'success')

// Error
showToast('Napaka pri nalaganju lekcije', 'error')
```

---

### 3. **Loading States - Skeleton Screens** ⏳
**Namesto spinnerjev, uporabi skeleton screens:**

```tsx
// src/components/LessonSkeleton.tsx
export default function LessonSkeleton() {
  return (
    <div className="lesson-page">
      <div style={{
        height: 80,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: 12,
        marginBottom: 30
      }} />
      
      <div style={{
        height: 400,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: 16,
        marginBottom: 30
      }} />
      
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          height: 120,
          background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: 12,
          marginBottom: 20
        }} />
      ))}
    </div>
  )
}
```

**CSS Animation:**
```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

### 4. **Performance Optimization** ⚡

#### A) **Lazy Loading Visualizations**
```tsx
// LessonPage.tsx
import { lazy, Suspense } from 'react'

const LessonVisualization = lazy(() => import('../components/LessonVisualizations'))

// Usage
<Suspense fallback={<VisualizationSkeleton />}>
  <LessonVisualization slug={lesson.slug} />
</Suspense>
```

#### B) **Memoization**
```tsx
// Quiz.tsx
import React, { memo, useMemo } from 'react'

const QuizQuestion = memo(({ question, index, onSelect }: Props) => {
  // Component won't re-render unless props change
  return (...)
})

// In Quiz component
const sortedQuestions = useMemo(() => 
  questions.sort((a, b) => a.order - b.order),
  [questions]
)
```

#### C) **Virtual Scrolling za dolge liste**
```bash
npm install react-window
```

```tsx
// LessonsList.tsx za velike količine lekcij
import { FixedSizeGrid } from 'react-window'

<FixedSizeGrid
  columnCount={3}
  columnWidth={350}
  height={800}
  rowCount={Math.ceil(lessons.length / 3)}
  rowHeight={280}
  width={1100}
>
  {({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * 3 + columnIndex
    const lesson = lessons[index]
    if (!lesson) return null
    return <LessonCard lesson={lesson} style={style} />
  }}
</FixedSizeGrid>
```

---

### 5. **Accessibility (A11y)** ♿

```tsx
// Dodaj fokus management in ARIA labels

// Quiz.tsx
<button
  onClick={() => toggleHint(qi)}
  disabled={!canUseHint(qi)}
  aria-label={`Prikaži namig za vprašanje ${qi + 1}`}
  aria-pressed={showHintForQuestion === qi}
  aria-disabled={!canUseHint(qi)}
>
  💡 <span className="hint-label">Namig</span>
</button>

// Keyboard navigation
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setShowQuiz(false)
    if (e.key === 'ArrowRight') nextQuestion()
    if (e.key === 'ArrowLeft') prevQuestion()
  }
  
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])

// Focus trap v modalu
import { useEffect, useRef } from 'react'

useEffect(() => {
  if (showQuiz) {
    const firstFocusable = modalRef.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    firstFocusable?.focus()
  }
}, [showQuiz])
```

---

### 6. **Data Persistence & Sync** 💾

```tsx
// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('LocalStorage error:', error)
    }
  }, [key, value])

  return [value, setValue] as const
}

// Usage - shrani progress
const [completedLessons, setCompletedLessons] = useLocalStorage<number[]>('completed_lessons', [])
const [quizScores, setQuizScores] = useLocalStorage<Record<number, number>>('quiz_scores', {})
```

---

### 7. **Input Validation & Sanitization** 🛡️

```tsx
// src/utils/validation.ts
export const validators = {
  email: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  
  username: (username: string) => {
    if (username.length < 3) return 'Uporabniško ime mora imeti vsaj 3 znake'
    if (username.length > 20) return 'Uporabniško ime je predolgo (max 20)'
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return 'Samo črke, številke, _ in -'
    return null
  },
  
  password: (password: string) => {
    if (password.length < 8) return 'Geslo mora imeti vsaj 8 znakov'
    if (!/[A-Z]/.test(password)) return 'Geslo mora vsebovati veliko črko'
    if (!/[0-9]/.test(password)) return 'Geslo mora vsebovati številko'
    return null
  },

  sanitize: (input: string) => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim()
  }
}

// Usage v RegisterPage
const usernameError = validators.username(username)
if (usernameError) {
  setError(usernameError)
  return
}
```

---

### 8. **Search & Filter Optimization** 🔍

```tsx
// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// LessonsList.tsx
const [searchQuery, setSearchQuery] = useState('')
const debouncedSearch = useDebounce(searchQuery, 300)

const filteredLessons = useMemo(() => {
  return lessons.filter(lesson => 
    lesson.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    lesson.developmentAndExplanation?.toLowerCase().includes(debouncedSearch.toLowerCase())
  )
}, [lessons, debouncedSearch])
```

---

### 9. **Progress Tracking System** 📈

```tsx
// src/contexts/ProgressContext.tsx
import { createContext, useContext, useEffect, useState } from 'react'

interface Progress {
  lessonsCompleted: Set<number>
  quizScores: Map<number, number>
  timeSpent: Map<number, number> // lesson ID -> minutes
  lastAccessed: Map<number, Date>
  streak: number // consecutive days
  totalXP: number
}

const ProgressContext = createContext<{
  progress: Progress
  markLessonComplete: (lessonId: number) => void
  recordQuizScore: (lessonId: number, score: number) => void
  recordTimeSpent: (lessonId: number, minutes: number) => void
  getProgressPercentage: () => number
} | undefined>(undefined)

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<Progress>(() => {
    const saved = localStorage.getItem('user_progress')
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        lessonsCompleted: new Set(parsed.lessonsCompleted),
        quizScores: new Map(parsed.quizScores),
        timeSpent: new Map(parsed.timeSpent),
        lastAccessed: new Map(parsed.lastAccessed.map(([k, v]: [number, string]) => [k, new Date(v)])),
        streak: parsed.streak,
        totalXP: parsed.totalXP
      }
    }
    return {
      lessonsCompleted: new Set(),
      quizScores: new Map(),
      timeSpent: new Map(),
      lastAccessed: new Map(),
      streak: 0,
      totalXP: 0
    }
  })

  useEffect(() => {
    const toSave = {
      lessonsCompleted: Array.from(progress.lessonsCompleted),
      quizScores: Array.from(progress.quizScores),
      timeSpent: Array.from(progress.timeSpent),
      lastAccessed: Array.from(progress.lastAccessed).map(([k, v]) => [k, v.toISOString()]),
      streak: progress.streak,
      totalXP: progress.totalXP
    }
    localStorage.setItem('user_progress', JSON.stringify(toSave))
  }, [progress])

  const markLessonComplete = (lessonId: number) => {
    setProgress(prev => ({
      ...prev,
      lessonsCompleted: new Set([...prev.lessonsCompleted, lessonId]),
      totalXP: prev.totalXP + 10
    }))
  }

  const recordQuizScore = (lessonId: number, score: number) => {
    const oldScore = progress.quizScores.get(lessonId) || 0
    const xpGain = score > oldScore ? (score - oldScore) * 5 : 0
    
    setProgress(prev => ({
      ...prev,
      quizScores: new Map(prev.quizScores).set(lessonId, score),
      totalXP: prev.totalXP + xpGain
    }))
  }

  const getProgressPercentage = () => {
    const totalLessons = 21 // Update based on actual count
    return (progress.lessonsCompleted.size / totalLessons) * 100
  }

  return (
    <ProgressContext.Provider value={{
      progress,
      markLessonComplete,
      recordQuizScore,
      recordTimeSpent: () => {},
      getProgressPercentage
    }}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const context = useContext(ProgressContext)
  if (!context) throw new Error('useProgress must be used within ProgressProvider')
  return context
}
```

---

### 10. **Mobile Responsive Improvements** 📱

```css
/* styles.css - Add mobile breakpoints */

/* Quiz Modal Mobile */
@media (max-width: 768px) {
  .quiz-modal {
    width: 100vw !important;
    height: 100vh !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    border-radius: 0 !important;
    margin: 0 !important;
  }
  
  .quiz-question-card h4 {
    font-size: 18px !important;
  }
  
  .quiz-options-grid {
    grid-template-columns: 1fr !important;
  }
  
  .hint-btn {
    padding: 8px 12px !important;
    font-size: 12px !important;
  }
}

/* Lesson Cards Mobile */
@media (max-width: 640px) {
  .lessons-grid {
    grid-template-columns: 1fr !important;
    padding: 12px !important;
  }
  
  .lesson-card {
    padding: 16px !important;
  }
}

/* Touch-friendly buttons */
@media (hover: none) and (pointer: coarse) {
  button, a {
    min-height: 44px; /* iOS touch target */
    min-width: 44px;
  }
}
```

---

## 📊 PRIORITIZIRANA CHECKLIST

### 🔥 KRITIČNO (Naredi TAKOJ)
- [ ] Popravi TypeScript errors (types za canvas-confetti, three)
- [ ] Dodaj ErrorBoundary
- [ ] Implementiraj Toast notifications
- [ ] Network error handling v CMS
- [ ] Loading skeleton screens

### ⚠️ VISOKA PRIORITETA (Ta teden)
- [ ] Progress tracking system
- [ ] useLocalStorage hook za persistence
- [ ] Input validation & sanitization
- [ ] Accessibility improvements (ARIA, keyboard nav)
- [ ] Mobile responsive fixes

### ⭐ SREDNJA PRIORITETA (Naslednji teden)
- [ ] Performance optimization (lazy loading, memoization)
- [ ] Search debouncing
- [ ] Virtual scrolling (če >50 lekcij)
- [ ] Better form error messages
- [ ] Time tracking za lekcije

### 💡 NIZKA PRIORITETA (Nice to have)
- [ ] Offline mode (PWA)
- [ ] Dark/Light theme toggle
- [ ] Export progress as PDF
- [ ] Email notifications
- [ ] Social sharing

---

## 🛠️ QUICK WINS (< 30 min)

```bash
# 1. Install missing types
npm install --save-dev @types/canvas-confetti @types/three

# 2. Fix tsconfig
# Change moduleResolution to "Bundler"

# 3. Add .env.example
# Create file with VITE_STRAPI_URL=

# 4. Add .gitignore check
# Ensure node_modules, .env, dist are ignored

# 5. Update package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "format": "prettier --write src"
  }
}
```

---

## 📈 PRIPOROČEN VRSTNI RED IMPLEMENTACIJE

**Teden 1: Stabilnost** 
1. Fix TypeScript errors ✅
2. ErrorBoundary + Toast ✅
3. Loading states (skeleton) ✅
4. Network error handling ✅

**Teden 2: User Experience**
5. Progress tracking ✅
6. Input validation ✅
7. Mobile responsiveness ✅
8. Accessibility ✅

**Teden 3: Performance**
9. Lazy loading ✅
10. Memoization ✅
11. Search optimization ✅
12. Local storage caching ✅

**Teden 4: Nove Teme**
13. Šele SEDAJ dodaj nove teme! 🎉

---

## 🎯 MERITVE USPEHA

**Performance:**
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Lighthouse Score > 90

**Accessibility:**
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] WCAG 2.1 AA compliant

**User Experience:**
- [ ] Error messages are clear
- [ ] Loading states are visible
- [ ] No unexpected crashes
- [ ] Mobile works smoothly

---

**Po implementaciji teh izboljšav bo aplikacija pripravljena za dodajanje novih tem brez težav!** 🚀
