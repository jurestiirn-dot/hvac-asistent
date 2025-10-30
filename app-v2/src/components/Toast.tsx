import React, { createContext, useContext, useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

const toastStyles: Record<ToastType, { bg: string; icon: string; shadow: string }> = {
  success: { 
    bg: 'linear-gradient(135deg, #10b981, #059669)', 
    icon: '✅',
    shadow: '0 8px 20px rgba(16, 185, 129, 0.4)'
  },
  error: { 
    bg: 'linear-gradient(135deg, #ef4444, #dc2626)', 
    icon: '❌',
    shadow: '0 8px 20px rgba(239, 68, 68, 0.4)'
  },
  warning: { 
    bg: 'linear-gradient(135deg, #f59e0b, #d97706)', 
    icon: '⚠️',
    shadow: '0 8px 20px rgba(245, 158, 11, 0.4)'
  },
  info: { 
    bg: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
    icon: 'ℹ️',
    shadow: '0 8px 20px rgba(59, 130, 246, 0.4)'
  }
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7)
    const newToast: Toast = { id, message, type }
    
    setToasts(prev => [...prev, newToast])
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none'
      }}>
        <AnimatePresence mode="popLayout">
          {toasts.map(toast => {
            const style = toastStyles[toast.type]
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 100, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={() => removeToast(toast.id)}
                style={{
                  background: style.bg,
                  color: 'white',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  boxShadow: style.shadow,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  minWidth: '300px',
                  maxWidth: '400px',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <span style={{ fontSize: '20px', flexShrink: 0 }}>
                  {style.icon}
                </span>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 600,
                  lineHeight: 1.4,
                  flex: 1
                }}>
                  {toast.message}
                </span>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeToast(toast.id)
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}
                >
                  ×
                </motion.button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
