import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  username: string
  email: string
  role: 'student' | 'admin'
  firstName?: string
  lastName?: string
  company?: string
  purpose?: string
  aiApiKey?: string
  unlockedLessons?: number[] // Array of lesson IDs that user can access
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (data: { username: string; email: string; password: string; firstName: string; lastName: string; company?: string; purpose?: string }) => Promise<void>
  logout: () => void
  loading: boolean
  updateUserRole: (targetUserId: string, role: 'student'|'admin') => void
  updateUserApiKey: (targetUserId: string, apiKey: string) => void
  updateUserLessons: (targetUserId: string, lessonIds: number[]) => void
  isLessonUnlocked: (lessonId: number) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored token on mount
    const token = localStorage.getItem('hvac_auth_token')
    const storedUser = localStorage.getItem('hvac_user')
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('hvac_auth_token')
        localStorage.removeItem('hvac_user')
      }
    }
    
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    setLoading(true)
    try {
      // Simulate API call - replace with real backend
      await new Promise(resolve => setTimeout(resolve, 800))
      // Try to load registered users and find this username
      const existingUsers = localStorage.getItem('hvac_registered_users')
      const users = existingUsers ? JSON.parse(existingUsers) as User[] : []
      const found = users.find(u => u.username === username)

        if (!found) {
          throw new Error('Uporabniško ime ne obstaja. Prosim registrirajte se.')
        }

      const mockToken = 'mock_jwt_token_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('hvac_auth_token', mockToken)
        localStorage.setItem('hvac_user', JSON.stringify(found))
        setUser(found)
      } catch (error: any) {
      console.error('Login failed:', error)
        throw new Error(error.message || 'Prijava ni uspela. Preverite uporabniško ime in geslo.')
    } finally {
      setLoading(false)
    }
  }

  const register = async (data: { username: string; email: string; password: string; firstName: string; lastName: string; company?: string; purpose?: string }) => {
    setLoading(true)
    try {
      // Simulate API call - replace with real backend
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if username already exists (mock)
      const existingUsers = localStorage.getItem('hvac_registered_users')
      const users = existingUsers ? JSON.parse(existingUsers) : []
      
      if (users.find((u: any) => u.username === data.username)) {
        throw new Error('Uporabniško ime je že zasedeno.')
      }

      const isFirstUser = users.length === 0

      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        username: data.username,
        email: data.email,
        role: isFirstUser ? 'admin' : 'student',
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        purpose: data.purpose
      }
      
      users.push(newUser)
      localStorage.setItem('hvac_registered_users', JSON.stringify(users))
      
      const mockToken = 'mock_jwt_token_' + Math.random().toString(36).substr(2, 9)
      
      localStorage.setItem('hvac_auth_token', mockToken)
      localStorage.setItem('hvac_user', JSON.stringify(newUser))
      
      setUser(newUser)
    } catch (error: any) {
      console.error('Registration failed:', error)
      throw new Error(error.message || 'Registracija ni uspela. Poskusite ponovno.')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('hvac_auth_token')
    localStorage.removeItem('hvac_user')
    setUser(null)
  }

  const updateUserRole = (targetUserId: string, role: 'student'|'admin') => {
    try {
      const existingUsers = localStorage.getItem('hvac_registered_users')
      const users = existingUsers ? JSON.parse(existingUsers) as User[] : []
      const idx = users.findIndex(u => u.id === targetUserId)
      if (idx >= 0) {
        users[idx] = { ...users[idx], role }
        localStorage.setItem('hvac_registered_users', JSON.stringify(users))
        // If updating current user, also reflect in session
        if (user?.id === targetUserId) {
          const updated = { ...user, role }
          setUser(updated)
          localStorage.setItem('hvac_user', JSON.stringify(updated))
        }
      }
    } catch (e) {
      console.error('updateUserRole failed', e)
    }
  }

  const updateUserApiKey = (targetUserId: string, apiKey: string) => {
    try {
      const existingUsers = localStorage.getItem('hvac_registered_users')
      const users = existingUsers ? JSON.parse(existingUsers) as User[] : []
      const idx = users.findIndex(u => u.id === targetUserId)
      if (idx >= 0) {
        users[idx] = { ...users[idx], aiApiKey: apiKey }
        localStorage.setItem('hvac_registered_users', JSON.stringify(users))
        // If updating current user, also reflect in session
        if (user?.id === targetUserId) {
          const updated = { ...user, aiApiKey: apiKey }
          setUser(updated)
          localStorage.setItem('hvac_user', JSON.stringify(updated))
        }
      }
    } catch (e) {
      console.error('updateUserApiKey failed', e)
    }
  }

  const updateUserLessons = (targetUserId: string, lessonIds: number[]) => {
    try {
      const existingUsers = localStorage.getItem('hvac_registered_users')
      const users = existingUsers ? JSON.parse(existingUsers) as User[] : []
      const idx = users.findIndex(u => u.id === targetUserId)
      if (idx >= 0) {
        users[idx] = { ...users[idx], unlockedLessons: lessonIds }
        localStorage.setItem('hvac_registered_users', JSON.stringify(users))
        // If updating current user, also reflect in session
        if (user?.id === targetUserId) {
          const updated = { ...user, unlockedLessons: lessonIds }
          setUser(updated)
          localStorage.setItem('hvac_user', JSON.stringify(updated))
        }
      }
    } catch (e) {
      console.error('updateUserLessons failed', e)
    }
  }

  const isLessonUnlocked = (lessonId: number): boolean => {
    // Admins have access to everything
    if (user?.role === 'admin') return true
    // Students need the lesson in their unlockedLessons array
    return user?.unlockedLessons?.includes(lessonId) ?? false
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        loading,
        updateUserRole,
        updateUserApiKey,
        updateUserLessons,
        isLessonUnlocked
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
