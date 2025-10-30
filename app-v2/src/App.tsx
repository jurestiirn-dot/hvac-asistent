import React from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import LessonsList from './pages/LessonsList'
import LessonPage from './pages/LessonPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProtectedRoute from './components/ProtectedRoute'
import { AnimatePresence, motion } from 'framer-motion'
import LottieHero from './components/LottieHero'
import OnboardingModal from './components/OnboardingModal'
import { useAuth } from './context/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import LanguageSelector from './components/LanguageSelector'
import { ToastProvider } from './components/Toast'
import QuizConfigAdmin from './components/QuizConfigAdmin'
import AdminRoute from './components/AdminRoute'
import AdminDashboard from './pages/AdminDashboard'
import ProfessorAnnex from './components/ProfessorAnnex'
import ProfesoricaAnnex from './components/ProfesoricaAnnex'
import { AvatarProvider } from './contexts/AvatarContext'
import AvatarOverlay from './components/Avatar/AvatarOverlay'

export default function App() {
  const [showOnboard, setShowOnboard] = React.useState(() => !localStorage.getItem('seen_onboard'))

  return (
    <LanguageProvider>
      <ToastProvider>
        <BrowserRouter>
          <AvatarProvider>
          <div className="app">
            <Header />
            <main>
            <AnimatedRoutes />
          </main>
          {/* Global Assistants */}
          <ProfessorAnnex />
          <ProfesoricaAnnex />
          {/* Global floating avatar */}
          <AvatarOverlay />
          {showOnboard && (
            <OnboardingModal onClose={() => { localStorage.setItem('seen_onboard','1'); setShowOnboard(false) }} />
          )}
        </div>
        </AvatarProvider>
      </BrowserRouter>
      </ToastProvider>
    </LanguageProvider>
  )
}

function Header() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = React.useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header style={{
      background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95) 0%, rgba(49, 46, 129, 0.95) 100%)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(167, 139, 250, 0.2)',
      padding: '1rem 2rem',
      boxShadow: '0 4px 20px rgba(124, 58, 237, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Logo and Title */}
        <Link to="/lessons" style={{textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 16}}>
          <div style={{
            width: 56,
            height: 56,
            background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* HVAC Fan Icon */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{fontSize: 28}}
            >
              ❄️
            </motion.div>
            {/* Airflow effect */}
            <motion.div
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                pointerEvents: 'none'
              }}
            />
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-0.5px'
            }}>
              HVAC Asistent
            </h1>
            <div style={{
              fontSize: 13,
              color: 'rgba(167, 139, 250, 0.9)',
              fontWeight: 500,
              marginTop: 2
            }}>
              Učni asistent z vizualizacijami
            </div>
          </div>
        </Link>

        {/* Navigation */}
        <nav style={{display: 'flex', alignItems: 'center', gap: 24}}>
          <LanguageSelector />
          
          <Link 
            to="/lessons" 
            style={{
              textDecoration: 'none',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: 15,
              fontWeight: 600,
              padding: '8px 20px',
              borderRadius: 8,
              background: 'rgba(167, 139, 250, 0.1)',
              border: '1px solid rgba(167, 139, 250, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(167, 139, 250, 0.2)'
              e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(167, 139, 250, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.3)'
            }}
          >
            📚 Lekcije
          </Link>

          {!isAuthenticated ? (
            <>
              <Link 
                to="/login"
                style={{
                  textDecoration: 'none',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: 15,
                  fontWeight: 600,
                  padding: '8px 20px',
                  borderRadius: 8,
                  background: 'rgba(167, 139, 250, 0.1)',
                  border: '1px solid rgba(167, 139, 250, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(167, 139, 250, 0.2)'
                  e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(167, 139, 250, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.3)'
                }}
              >
                Prijava
              </Link>
              <Link 
                to="/register"
                style={{
                  textDecoration: 'none',
                  color: 'white',
                  fontSize: 15,
                  fontWeight: 600,
                  padding: '8px 20px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                  border: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(124, 58, 237, 0.3)'
                }}
              >
                Registracija
              </Link>
            </>
          ) : (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  background: 'rgba(167, 139, 250, 0.15)',
                  border: '1px solid rgba(167, 139, 250, 0.3)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: 600,
                  padding: '8px 16px',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(167, 139, 250, 0.25)'
                  e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(167, 139, 250, 0.15)'
                  e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.3)'
                }}
              >
                <span style={{fontSize: 20}}>👤</span> {user?.username}
              </button>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="user-menu"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 8,
                    background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.98) 0%, rgba(49, 46, 129, 0.98) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(167, 139, 250, 0.3)',
                    borderRadius: 8,
                    padding: 8,
                    minWidth: 200,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                    zIndex: 1000
                  }}
                >
                  <div style={{
                    padding: '12px 16px',
                    color: 'rgba(167, 139, 250, 0.9)',
                    fontSize: 13,
                    borderBottom: '1px solid rgba(167, 139, 250, 0.2)'
                  }}>
                    {user?.email}
                  </div>
                  {user?.role === 'admin' && (
                    <>
                      <Link
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        style={{
                          display: 'block',
                          width: '100%',
                          background: 'rgba(167, 139, 250, 0.1)',
                          border: '1px solid rgba(167, 139, 250, 0.3)',
                          color: 'rgba(167, 139, 250, 0.9)',
                          padding: '10px 16px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 600,
                          marginTop: 8,
                          textDecoration: 'none',
                          textAlign: 'left',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(167, 139, 250, 0.2)'
                          e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.5)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(167, 139, 250, 0.1)'
                          e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.3)'
                        }}
                      >
                        🛠️ Admin
                      </Link>
                      <Link
                        to="/admin/quiz-config"
                        onClick={() => setShowUserMenu(false)}
                        style={{
                          display: 'block',
                          width: '100%',
                          background: 'rgba(167, 139, 250, 0.1)',
                          border: '1px solid rgba(167, 139, 250, 0.3)',
                          color: 'rgba(167, 139, 250, 0.9)',
                          padding: '10px 16px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 600,
                          marginTop: 8,
                          textDecoration: 'none',
                          textAlign: 'left',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(167, 139, 250, 0.2)'
                          e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.5)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(167, 139, 250, 0.1)'
                          e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.3)'
                        }}
                      >
                        ⚙️ Nastavitve kviza
                      </Link>
                    </>
                  )}
                  <button 
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#fca5a5',
                      padding: '10px 16px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600,
                      marginTop: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    🚪 Odjava
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><LessonsList/></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><LoginPage/></PageWrapper>} />
        <Route path="/register" element={<PageWrapper><RegisterPage/></PageWrapper>} />
        <Route 
          path="/admin/quiz-config" 
          element={
            <PageWrapper>
              <AdminRoute>
                <QuizConfigAdmin/>
              </AdminRoute>
            </PageWrapper>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <PageWrapper>
              <AdminRoute>
                <AdminDashboard/>
              </AdminRoute>
            </PageWrapper>
          } 
        />
        <Route 
          path="/lessons" 
          element={
            <PageWrapper>
              <ProtectedRoute>
                <LessonsList/>
              </ProtectedRoute>
            </PageWrapper>
          } 
        />
        <Route 
          path="/lessons/:slug" 
          element={
            <PageWrapper>
              <ProtectedRoute>
                <LessonPage/>
              </ProtectedRoute>
            </PageWrapper>
          } 
        />
      </Routes>
    </AnimatePresence>
  )
}

function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
      {children}
    </motion.div>
  )
}
