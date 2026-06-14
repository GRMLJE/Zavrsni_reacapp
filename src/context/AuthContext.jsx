import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('kvart_user'))
        || JSON.parse(localStorage.getItem('user'))
        || null
  } catch {
    return null
  }
}

function readStoredToken() {
  return localStorage.getItem('kvart_token') || null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [token, setToken] = useState(readStoredToken)

  function login(userData, authToken) {
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    if (authToken) {
      localStorage.setItem('kvart_token', authToken)
      setToken(authToken)
    }
  }

  function logout() {
    localStorage.removeItem('kvart_user')
    localStorage.removeItem('user')
    localStorage.removeItem('kvart_token')
    setUser(null)
    setToken(null)
  }

  function authHeaders() {
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authHeaders }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
