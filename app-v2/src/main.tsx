import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import { QuizConfigProvider } from './contexts/QuizConfigContext'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <QuizConfigProvider>
          <App />
        </QuizConfigProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
