import { createContext, useContext, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('moviehub:user')
    return saved ? JSON.parse(saved) : null
  })

  async function login({ email, password }) {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('moviehub:token', data.token)
    localStorage.setItem('moviehub:user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  async function register({ name, email, password }) {
    await api.post('/auth/register', { name, email, password })
    // A API de registro não retorna token, então encadeamos o login
    return login({ email, password })
  }

  function logout() {
    localStorage.removeItem('moviehub:token')
    localStorage.removeItem('moviehub:user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth precisa ser usado dentro de um AuthProvider')
  }
  return context
}
