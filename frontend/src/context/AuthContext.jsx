import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { apiFetch, getToken, setToken } from '../api/client.js'

const AuthContext = createContext(null)

function readStoredUser() {
  if (!getToken()) {
    localStorage.removeItem('quanlyshop_user')
    return null
  }
  const raw = localStorage.getItem('quanlyshop_user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser())

  const login = useCallback(async (username, password) => {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Đăng nhập thất bại')
    }
    const data = await res.json()
    setToken(data.token)
    const u = { username: data.username, email: data.email, role: data.role }
    localStorage.setItem('quanlyshop_user', JSON.stringify(u))
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (payload) => {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const text = await res.text()
    if (!res.ok) throw new Error(text || 'Đăng ký thất bại')
    return text
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    localStorage.removeItem('quanlyshop_user')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(getToken()),
      isAdmin: user?.role === 'ADMIN',
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
